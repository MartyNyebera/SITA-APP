import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? "http://127.0.0.1:3010";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket || !socket.connected) {
    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// ─── Driver socket helpers ───────────────────────────────────

export function driverGoOnline(driverId: string, latitude: number, longitude: number) {
  getSocket().emit("driver:online", { driverId, latitude, longitude });
}

export function driverGoOffline(driverId: string) {
  getSocket().emit("driver:offline", { driverId });
}

export function driverUpdateLocation(
  driverId: string,
  latitude: number,
  longitude: number,
  speed?: number,
  heading?: number
) {
  getSocket().emit("driver:location", { driverId, latitude, longitude, speed, heading });
}

export function driverAcceptRide(driverId: string, rideId: string) {
  getSocket().emit("driver:accept-ride", { driverId, rideId });
}

export function driverStartRide(driverId: string, rideId: string) {
  getSocket().emit("driver:start-ride", { driverId, rideId });
}

export function driverCompleteRide(driverId: string, rideId: string) {
  getSocket().emit("driver:complete-ride", { driverId, rideId });
}

// ─── Customer socket helpers ─────────────────────────────────

export function customerRequestRide(data: {
  customerId: string;
  pickupLatitude: number;
  pickupLongitude: number;
  dropoffLatitude: number;
  dropoffLongitude: number;
  pickupAddress: string;
  dropoffAddress: string;
}) {
  getSocket().emit("ride:request", data);
}

export function customerWatchDrivers() {
  getSocket().emit("customer:watch-drivers");
}

export function customerWatchDriver(driverId: string) {
  getSocket().emit("ride:watch", { driverId });
}

export function customerLeaveRide(rideId: string) {
  getSocket().emit("ride:leave", { rideId });
}
