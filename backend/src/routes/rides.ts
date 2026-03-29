import { Router, Response } from "express";
import { query } from "../db/pool";
import { authenticateToken, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

// ─── Fare Calculation Helper ─────────────────────────────────
function calculateFare(distanceKm: number): number {
  const BASE_FARE = 40;
  const PER_KM_RATE = 15;
  return Math.round(BASE_FARE + distanceKm * PER_KM_RATE);
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── POST /api/rides ─────────────────────────────────────────
router.post("/", authenticateToken, requireRole("user"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      pickupAddress, pickupLatitude, pickupLongitude,
      dropoffAddress, dropoffLatitude, dropoffLongitude,
      paymentMethod,
    } = req.body;

    if (!pickupAddress || !pickupLatitude || !pickupLongitude || !dropoffAddress || !dropoffLatitude || !dropoffLongitude) {
      res.status(400).json({ success: false, message: "Missing ride location details" });
      return;
    }

    const distanceKm = haversineDistance(pickupLatitude, pickupLongitude, dropoffLatitude, dropoffLongitude);
    const fareAmount = calculateFare(distanceKm);

    const result = await query(
      `INSERT INTO rides
         (customer_id, pickup_address, pickup_latitude, pickup_longitude,
          dropoff_address, dropoff_latitude, dropoff_longitude,
          distance_km, fare_amount, payment_method, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'requested')
       RETURNING *`,
      [
        req.user!.id, pickupAddress, pickupLatitude, pickupLongitude,
        dropoffAddress, dropoffLatitude, dropoffLongitude,
        distanceKm.toFixed(2), fareAmount,
        paymentMethod || "cash",
      ]
    );

    const ride = result.rows[0];

    await query(
      `INSERT INTO audit_logs (actor_id, actor_type, action, target_type, target_id)
       VALUES ($1, 'user', 'ride_requested', 'ride', $2)`,
      [req.user!.id, ride.id]
    );

    res.status(201).json({ success: true, data: ride });
  } catch (err) {
    console.error("Create ride error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── GET /api/rides/:rideId ───────────────────────────────────
router.get("/:rideId", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rideId } = req.params;
    const result = await query(
      `SELECT * FROM ride_details_view WHERE ride_id = $1`,
      [rideId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "Ride not found" });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Get ride error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── PATCH /api/rides/:rideId/accept ─────────────────────────
router.patch("/:rideId/accept", authenticateToken, requireRole("driver"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rideId } = req.params;
    const driverId = req.user!.id;

    const check = await query(
      "SELECT id, status FROM rides WHERE id = $1",
      [rideId]
    );

    if (check.rows.length === 0) {
      res.status(404).json({ success: false, message: "Ride not found" });
      return;
    }

    if (check.rows[0].status !== "requested") {
      res.status(409).json({ success: false, message: "Ride is no longer available" });
      return;
    }

    const result = await query(
      `UPDATE rides
       SET status = 'accepted', driver_id = $1, accepted_at = NOW()
       WHERE id = $2 AND status = 'requested'
       RETURNING *`,
      [driverId, rideId]
    );

    if (result.rows.length === 0) {
      res.status(409).json({ success: false, message: "Ride already taken" });
      return;
    }

    await query(
      `INSERT INTO audit_logs (actor_id, actor_type, action, target_type, target_id)
       VALUES ($1, 'driver', 'ride_accepted', 'ride', $2)`,
      [driverId, rideId]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Accept ride error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── PATCH /api/rides/:rideId/arrived ────────────────────────
router.patch("/:rideId/arrived", authenticateToken, requireRole("driver"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rideId } = req.params;

    const result = await query(
      `UPDATE rides SET status = 'arrived', arrived_at = NOW()
       WHERE id = $1 AND driver_id = $2 AND status = 'accepted'
       RETURNING *`,
      [rideId, req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "Ride not found or not in accepted state" });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Arrived at pickup error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── PATCH /api/rides/:rideId/start ──────────────────────────
router.patch("/:rideId/start", authenticateToken, requireRole("driver"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rideId } = req.params;

    const result = await query(
      `UPDATE rides SET status = 'in_progress', started_at = NOW()
       WHERE id = $1 AND driver_id = $2 AND status = 'arrived'
       RETURNING *`,
      [rideId, req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "Ride not found or customer not yet boarded" });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Start ride error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── PATCH /api/rides/:rideId/complete ───────────────────────
router.patch("/:rideId/complete", authenticateToken, requireRole("driver"), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rideId } = req.params;

    const rideResult = await query(
      `UPDATE rides SET status = 'completed', completed_at = NOW()
       WHERE id = $1 AND driver_id = $2 AND status = 'in_progress'
       RETURNING *`,
      [rideId, req.user!.id]
    );

    if (rideResult.rows.length === 0) {
      res.status(404).json({ success: false, message: "Ride not found or not in progress" });
      return;
    }

    const ride = rideResult.rows[0];
    const driverPayout = ride.fare_amount * 0.85;
    const platformFee = ride.fare_amount * 0.15;

    await query(
      `INSERT INTO payments
         (ride_id, customer_id, driver_id, amount, payment_method, status, driver_payout, platform_fee, processed_at)
       VALUES ($1, $2, $3, $4, $5, 'completed', $6, $7, NOW())`,
      [ride.id, ride.customer_id, ride.driver_id, ride.fare_amount, ride.payment_method, driverPayout, platformFee]
    );

    await query(
      `UPDATE drivers
       SET total_rides = total_rides + 1,
           total_earnings = total_earnings + $1
       WHERE id = $2`,
      [driverPayout, ride.driver_id]
    );

    await query(
      `UPDATE users SET total_rides = total_rides + 1 WHERE id = $1`,
      [ride.customer_id]
    );

    await query(
      `INSERT INTO wallet_transactions
         (owner_id, owner_type, type, amount, balance_after, reference_id, description)
       SELECT $1, 'driver', 'payout', $2, total_earnings, $3, 'Ride completed payout'
       FROM drivers WHERE id = $1`,
      [ride.driver_id, driverPayout, ride.id]
    );

    await query(
      `INSERT INTO audit_logs (actor_id, actor_type, action, target_type, target_id)
       VALUES ($1, 'driver', 'ride_completed', 'ride', $2)`,
      [req.user!.id, rideId]
    );

    res.json({ success: true, data: ride, payment: { amount: ride.fare_amount, driverPayout, platformFee } });
  } catch (err) {
    console.error("Complete ride error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── PATCH /api/rides/:rideId/cancel ─────────────────────────
router.patch("/:rideId/cancel", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rideId } = req.params;
    const { reason } = req.body;

    const result = await query(
      `UPDATE rides
       SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = $1
       WHERE id = $2
         AND status IN ('requested', 'accepted', 'arrived')
         AND (customer_id = $3 OR driver_id = $3)
       RETURNING *`,
      [reason || null, rideId, req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "Ride not found or cannot be cancelled" });
      return;
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Cancel ride error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ─── PATCH /api/rides/:rideId/rate ───────────────────────────
router.patch("/:rideId/rate", authenticateToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { rideId } = req.params;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
      return;
    }

    const role = req.user!.role;
    const field = role === "user" ? "customer_rating" : "driver_rating";
    const idField = role === "user" ? "customer_id" : "driver_id";

    const result = await query(
      `UPDATE rides SET ${field} = $1
       WHERE id = $2 AND ${idField} = $3 AND status = 'completed'
       RETURNING id, customer_rating, driver_rating`,
      [rating, rideId, req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "Ride not found or not completed" });
      return;
    }

    if (role === "user") {
      await query(
        `UPDATE drivers SET average_rating =
           (SELECT AVG(driver_rating) FROM rides WHERE driver_id = drivers.id AND driver_rating IS NOT NULL)
         WHERE id = (SELECT driver_id FROM rides WHERE id = $1)`,
        [rideId]
      );
    } else {
      await query(
        `UPDATE users SET average_rating =
           (SELECT AVG(customer_rating) FROM rides WHERE customer_id = users.id AND customer_rating IS NOT NULL)
         WHERE id = (SELECT customer_id FROM rides WHERE id = $1)`,
        [rideId]
      );
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error("Rate ride error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
