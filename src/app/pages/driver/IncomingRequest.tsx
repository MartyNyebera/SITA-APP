import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { MapPin, X, Check, Phone, Clock } from "lucide-react";
import { MapView } from "../../components/MapView";
import { getStoredUser, ridesApi, type DriverData } from "../../services/api";
import { driverAcceptRide, getSocket } from "../../services/socket";

const CUSTOMER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23E5E7EB'/%3E%3Cpath d='M50 45c8.284 0 15-6.716 15-15s-6.716-15-15-15-15 6.716-15 15 6.716 15 15 15zM50 50c-16.569 0-30 10.745-30 24v6h60v-6c0-13.255-13.431-24-30-24z' fill='%239CA3AF'/%3E%3C/svg%3E";

const REQUEST_MARKERS = [
  { x: 50, y: 56, type: "pickup" as const },
  { x: 68, y: 74, type: "dropoff" as const },
  { x: 35, y: 45, type: "driver" as const },
];

export function DriverRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { rideId?: string; pickupAddress?: string; dropoffAddress?: string; fare?: number; distance?: number } | null;

  const [countdown, setCountdown] = useState(20);
  const [accepted, setAccepted] = useState(false);

  const driver = getStoredUser<DriverData>();
  const driverId = driver?.id;

  useEffect(() => {
    const socket = getSocket();
    socket.on("ride:available", (data: { rideId: string; pickupAddress: string; dropoffAddress: string }) => {
      navigate("/driver/request", { state: { rideId: data.rideId, pickupAddress: data.pickupAddress, dropoffAddress: data.dropoffAddress } });
    });
    return () => { socket.off("ride:available"); };
  }, [navigate]);

  useEffect(() => {
    if (countdown <= 0) {
      navigate("/driver/home");
      return;
    }
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown, navigate]);

  const handleAccept = async () => {
    if (!driverId || !state?.rideId) {
      setAccepted(true);
      setTimeout(() => navigate("/driver/active"), 1200);
      return;
    }
    setAccepted(true);
    try {
      driverAcceptRide(driverId, state.rideId);
      await ridesApi.accept(state.rideId);
    } catch { /* ignore, socket handles it */ }
    setTimeout(() => navigate("/driver/active", { state: { rideId: state.rideId } }), 1200);
  };

  return (
    <div className="relative h-full w-full bg-[#1a1a2e] flex flex-col overflow-hidden">
      {/* Map background */}
      <div className="flex-1 relative">
        <MapView markers={REQUEST_MARKERS} className="w-full h-full" label="Poblacion Area" />

        {/* Timer ring overlay */}
        <div className="absolute top-10 left-0 right-0 flex justify-center pointer-events-none">
          <div className="bg-[#1a1a2e]/80 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#F47920]" />
            <span className="text-white text-sm font-bold">{countdown}s</span>
            <span className="text-gray-400 text-xs">para sumagot</span>
          </div>
        </div>

        {/* Countdown progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
          <motion.div
            className="h-full bg-[#F47920]"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 20, ease: "linear" }}
          />
        </div>
      </div>

      {/* Request Sheet */}
      <motion.div
        initial={{ y: 400 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-white rounded-t-3xl shadow-2xl px-5 pt-4 pb-8"
      >
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-[#F47920] rounded-full animate-pulse" />
          <p className="text-gray-800 font-bold text-base">Bagong Booking Request!</p>
        </div>

        {/* Customer info */}
        <div className="flex items-center gap-3 mb-4 bg-gray-50 rounded-2xl p-3">
          <img src={CUSTOMER_IMAGE} alt="Customer" className="w-12 h-12 rounded-full object-cover border-2 border-[#F47920]" />
          <div className="flex-1">
            <p className="text-gray-800 font-bold text-sm">Maria A. Santos</p>
            <div className="flex items-center gap-1">
              <span className="text-yellow-400 text-xs">★★★★★</span>
              <span className="text-gray-500 text-xs">4.9 · Verified Passenger</span>
            </div>
          </div>
          <button className="w-9 h-9 rounded-full bg-[#F47920]/10 flex items-center justify-center">
            <Phone className="w-4 h-4 text-[#F47920]" />
          </button>
        </div>

        {/* Route */}
        <div className="bg-gray-50 rounded-2xl px-4 py-3 mb-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex flex-col items-center mt-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div className="w-px h-8 bg-gray-300 my-1" />
              <div className="w-3 h-3 rounded-full bg-[#F47920]" />
            </div>
            <div className="flex-1">
              <div className="mb-2">
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Pickup</p>
                <p className="text-sm font-semibold text-gray-800">{state?.pickupAddress || "Current Location"}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400 uppercase font-semibold">Drop-off</p>
                <p className="text-sm font-semibold text-gray-800">{state?.dropoffAddress || "Destinasyon"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fare info */}
        <div className="flex gap-3 mb-5">
          <div className="flex-1 bg-[#F47920]/10 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-500">Kita Mo</p>
            <p className="text-[#F47920] font-black text-xl">₱ 35</p>
          </div>
          <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-500">Distansya</p>
            <p className="text-gray-700 font-bold text-lg">1.8 km</p>
          </div>
          <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-500">Oras</p>
            <p className="text-gray-700 font-bold text-lg">~8 min</p>
          </div>
        </div>

        {/* Accept / Decline */}
        {!accepted ? (
          <div className="flex gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/driver/home")}
              className="w-12 h-14 bg-red-50 rounded-2xl flex items-center justify-center flex-shrink-0"
            >
              <X className="w-6 h-6 text-red-500" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAccept}
              className="flex-1 bg-[#F47920] text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Tanggapin ang Booking
            </motion.button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 rounded-2xl py-4 flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-bold">Tinanggap! Papunta na sa pasahero...</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}