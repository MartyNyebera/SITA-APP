import { Server as SocketServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { query, supabase } from "../db/supabase";

// ─── In-memory driver state ───────────────────────────────────
interface DriverState {
  driverId: string;
  socketId: string;
  latitude: number;
  longitude: number;
  isOnline: boolean;
  currentRideId?: string;
  lastUpdate: number;
}

const onlineDrivers = new Map<string, DriverState>();

// ─── Haversine distance (meters) ─────────────────────────────
function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function initSocketServer(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:5173"],
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // ── Driver goes online ──────────────────────────────────
    socket.on("driver:online", async (data: { driverId: string; latitude: number; longitude: number }) => {
      const { driverId, latitude, longitude } = data;

      onlineDrivers.set(driverId, {
        driverId,
        socketId: socket.id,
        latitude,
        longitude,
        isOnline: true,
        lastUpdate: Date.now(),
      });

      socket.join(`driver:${driverId}`);

      try {
        await query("drivers", {
          update: {
            is_online: true,
            current_latitude: latitude,
            current_longitude: longitude,
            location_updated_at: new Date().toISOString()
          },
          filter: { id: driverId }
        });
      } catch (err) {
        console.error("[Socket] driver:online DB error:", err);
      }

      socket.emit("online:confirmed", { message: "You are now online", driverId });
      io.emit("drivers:updated", { type: "online", driverId, latitude, longitude });
      console.log(`[Socket] Driver ${driverId} is now ONLINE`);
    });

    // ── Driver location update ──────────────────────────────
    socket.on("driver:location", async (data: {
      driverId: string;
      latitude: number;
      longitude: number;
      speed?: number;
      heading?: number;
    }) => {
      const { driverId, latitude, longitude, speed, heading } = data;

      const state = onlineDrivers.get(driverId);
      if (!state) return;

      state.latitude = latitude;
      state.longitude = longitude;
      state.lastUpdate = Date.now();

      // Broadcast to customers watching this driver
      io.to(`watching:${driverId}`).emit("driver:location-update", {
        driverId, latitude, longitude, speed, heading, timestamp: Date.now(),
      });

      // Broadcast to all customers watching available drivers
      io.emit("driver:location-update", { driverId, latitude, longitude });

      try {
        await query("drivers", {
          update: {
            current_latitude: latitude,
            current_longitude: longitude,
            location_updated_at: new Date().toISOString()
          },
          filter: { id: driverId }
        });

        await query("driver_locations", {
          insert: {
            driver_id: driverId,
            ride_id: state.currentRideId || null,
            latitude,
            longitude,
            speed: speed || null,
            heading: heading || null
          }
        });

        // Geofencing check if driver has an active ride
        if (state.currentRideId) {
          await checkGeofence(io, driverId, state.currentRideId, latitude, longitude);
        }
      } catch (err) {
        console.error("[Socket] driver:location DB error:", err);
      }
    });

    // ── Driver accepts a ride ──────────────────────────────
    socket.on("driver:accept-ride", async (data: { driverId: string; rideId: string }) => {
      const { driverId, rideId } = data;

      try {
        const result = await query(
          `UPDATE rides SET status = 'accepted', driver_id = $1, accepted_at = NOW()
           WHERE id = $2 AND status = 'requested'
           RETURNING *, (SELECT customer_id FROM rides WHERE id = $2) AS customer_id`,
          [driverId, rideId]
        );

        if (result.rows.length === 0) {
          socket.emit("ride:error", { message: "Ride no longer available" });
          return;
        }

        const ride = result.rows[0];
        const state = onlineDrivers.get(driverId);
        if (state) state.currentRideId = rideId;

        socket.join(`ride:${rideId}`);
        socket.emit("ride:accepted-confirmed", { rideId, ride });

        io.to(`customer:${ride.customer_id}`).emit("ride:driver-accepted", {
          rideId,
          driverId,
          message: "Driver is on the way!",
        });

        console.log(`[Socket] Driver ${driverId} accepted ride ${rideId}`);
      } catch (err) {
        console.error("[Socket] driver:accept-ride error:", err);
      }
    });

    // ── Driver starts the ride ─────────────────────────────
    socket.on("driver:start-ride", async (data: { driverId: string; rideId: string }) => {
      const { driverId, rideId } = data;

      try {
        await query(
          `UPDATE rides SET status = 'in_progress', started_at = NOW()
           WHERE id = $1 AND driver_id = $2 AND status = 'arrived'`,
          [rideId, driverId]
        );

        io.to(`ride:${rideId}`).emit("ride:started", { rideId, message: "Ride has started!" });
        console.log(`[Socket] Ride ${rideId} started`);
      } catch (err) {
        console.error("[Socket] driver:start-ride error:", err);
      }
    });

    // ── Driver completes the ride ──────────────────────────
    socket.on("driver:complete-ride", async (data: { driverId: string; rideId: string }) => {
      const { driverId, rideId } = data;

      try {
        const result = await query(
          `UPDATE rides SET status = 'completed', completed_at = NOW()
           WHERE id = $1 AND driver_id = $2 AND status = 'in_progress'
           RETURNING *`,
          [rideId, driverId]
        );

        if (result.rows.length === 0) {
          socket.emit("ride:error", { message: "Cannot complete ride" });
          return;
        }

        const ride = result.rows[0];
        const driverPayout = ride.fare_amount * 0.85;
        const platformFee = ride.fare_amount * 0.15;

        await query(
          `INSERT INTO payments (ride_id, customer_id, driver_id, amount, payment_method, status, driver_payout, platform_fee, processed_at)
           VALUES ($1, $2, $3, $4, $5, 'completed', $6, $7, NOW())`,
          [ride.id, ride.customer_id, driverId, ride.fare_amount, ride.payment_method, driverPayout, platformFee]
        );

        await query(
          `UPDATE drivers SET total_rides = total_rides + 1, total_earnings = total_earnings + $1 WHERE id = $2`,
          [driverPayout, driverId]
        );
        await query(
          `UPDATE users SET total_rides = total_rides + 1 WHERE id = $1`,
          [ride.customer_id]
        );

        const state = onlineDrivers.get(driverId);
        if (state) state.currentRideId = undefined;

        io.to(`ride:${rideId}`).emit("ride:completed", {
          rideId,
          fare: ride.fare_amount,
          driverPayout,
          message: "Ride completed!",
        });

        console.log(`[Socket] Ride ${rideId} completed`);
      } catch (err) {
        console.error("[Socket] driver:complete-ride error:", err);
      }
    });

    // ── Driver goes offline ────────────────────────────────
    socket.on("driver:offline", async (data: { driverId: string }) => {
      const { driverId } = data;
      onlineDrivers.delete(driverId);

      try {
        await query(
          `UPDATE drivers SET is_online = FALSE WHERE id = $1`,
          [driverId]
        );
      } catch (err) {
        console.error("[Socket] driver:offline DB error:", err);
      }

      io.emit("drivers:updated", { type: "offline", driverId });
      console.log(`[Socket] Driver ${driverId} is now OFFLINE`);
    });

    // ── Customer requests a ride ────────────────────────────
    socket.on("ride:request", async (data: {
      customerId: string;
      pickupLatitude: number;
      pickupLongitude: number;
      dropoffLatitude: number;
      dropoffLongitude: number;
      pickupAddress: string;
      dropoffAddress: string;
    }) => {
      const { customerId, pickupLatitude, pickupLongitude, dropoffLatitude, dropoffLongitude, pickupAddress, dropoffAddress } = data;

      socket.join(`customer:${customerId}`);
      socket.emit("ride:searching", { message: "Finding nearby drivers..." });

      // Find nearby drivers (within 5km)
      const nearbyDrivers: DriverState[] = [];
      for (const driver of onlineDrivers.values()) {
        const dist = distanceMeters(pickupLatitude, pickupLongitude, driver.latitude, driver.longitude);
        if (dist <= 5000 && !driver.currentRideId) {
          nearbyDrivers.push(driver);
        }
      }

      // Broadcast ride request to nearby drivers
      for (const driver of nearbyDrivers) {
        io.to(`driver:${driver.driverId}`).emit("ride:available", {
          customerId,
          pickupAddress,
          dropoffAddress,
          pickupLatitude,
          pickupLongitude,
          dropoffLatitude,
          dropoffLongitude,
        });
      }

      console.log(`[Socket] Ride request from ${customerId} - ${nearbyDrivers.length} drivers notified`);
    });

    // ── Customer watches all active drivers ─────────────────
    socket.on("customer:watch-drivers", () => {
      const drivers = Array.from(onlineDrivers.values()).map((d) => ({
        driverId: d.driverId,
        latitude: d.latitude,
        longitude: d.longitude,
        available: !d.currentRideId,
      }));
      socket.emit("drivers:snapshot", { drivers });
    });

    // ── Customer watches a specific driver ──────────────────
    socket.on("ride:watch", (data: { driverId: string }) => {
      socket.join(`watching:${data.driverId}`);
    });

    // ── Customer leaves ride ────────────────────────────────
    socket.on("ride:leave", (data: { rideId: string }) => {
      socket.leave(`ride:${data.rideId}`);
    });

    // ── On disconnect ────────────────────────────────────────
    socket.on("disconnect", async () => {
      for (const [driverId, state] of onlineDrivers.entries()) {
        if (state.socketId === socket.id) {
          onlineDrivers.delete(driverId);
          try {
            await query(`UPDATE drivers SET is_online = FALSE WHERE id = $1`, [driverId]);
          } catch (err) {
            console.error("[Socket] disconnect DB error:", err);
          }
          io.emit("drivers:updated", { type: "offline", driverId });
          console.log(`[Socket] Driver ${driverId} disconnected`);
          break;
        }
      }
    });
  });

  return io;
}

// ─── Geofencing checker ───────────────────────────────────────
async function checkGeofence(
  io: SocketServer,
  driverId: string,
  rideId: string,
  latitude: number,
  longitude: number
): Promise<void> {
  try {
    const result = await query(
      `SELECT status, pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude, customer_id
       FROM rides WHERE id = $1`,
      [rideId]
    );

    if (result.rows.length === 0) return;

    const ride = result.rows[0];

    if (ride.status === "accepted") {
      const dist = distanceMeters(latitude, longitude, ride.pickup_latitude, ride.pickup_longitude);
      if (dist <= 150) {
        await query(
          `UPDATE rides SET status = 'arrived', arrived_at = NOW() WHERE id = $1 AND status = 'accepted'`,
          [rideId]
        );
        io.to(`customer:${ride.customer_id}`).emit("driver:arrived-at-pickup", {
          rideId,
          message: "Your driver has arrived! Please come out.",
        });
        io.to(`ride:${rideId}`).emit("ride:status-update", { status: "arrived" });
        console.log(`[Geofence] Driver ${driverId} arrived at pickup for ride ${rideId}`);
      }
    }

    if (ride.status === "in_progress") {
      const dist = distanceMeters(latitude, longitude, ride.dropoff_latitude, ride.dropoff_longitude);
      if (dist <= 100) {
        io.to(`ride:${rideId}`).emit("driver:near-dropoff", {
          rideId,
          message: "Approaching your destination!",
        });
        console.log(`[Geofence] Driver ${driverId} near dropoff for ride ${rideId}`);
      }
    }
  } catch (err) {
    console.error("[Geofence] Error:", err);
  }
}
