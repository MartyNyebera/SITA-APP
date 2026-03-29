import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { X, MapPin, ChevronLeft, Phone, MessageCircle } from "lucide-react";
import { MapView } from "../../components/MapView";
import { ridesApi, type RideData } from "../../services/api";
import { getSocket, customerWatchDriver } from "../../services/socket";

const DRIVER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23E5E7EB'/%3E%3Cpath d='M50 45c8.284 0 15-6.716 15-15s-6.716-15-15-15-15 6.716-15 15 6.716 15 15 15zM50 50c-16.569 0-30 10.745-30 24v6h60v-6c0-13.255-13.431-24-30-24z' fill='%239CA3AF'/%3E%3C/svg%3E";

const MARKERS = [
  { x: 50, y: 56, type: "pickup" as const },
  { x: 68, y: 74, type: "dropoff" as const },
];
const SEARCHING_MARKERS = [
  { x: 50, y: 56, type: "pickup" as const },
  { x: 32, y: 38, type: "driver" as const },
  { x: 68, y: 74, type: "driver2" as const },
  { x: 15, y: 56, type: "driver3" as const },
];

export function CustomerFinding() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { rideId?: string; pickup?: string; dropoff?: string } | null;
  const rideId = state?.rideId;
  const pickupText = state?.pickup || "Current Location";
  const dropoffText = state?.dropoff || "Destinasyon";

  const [phase, setPhase] = useState<"searching" | "found">("searching");
  const [countdown, setCountdown] = useState(10);
  const [rideData, setRideData] = useState<RideData | null>(null);

  useEffect(() => {
    if (!rideId) return;
    const socket = getSocket();

    socket.on("ride:driver-accepted", (data: { rideId: string; driverId: string }) => {
      if (data.rideId !== rideId) return;
      customerWatchDriver(data.driverId);
      ridesApi.get(rideId).then((res) => {
        setRideData(res.data);
        setPhase("found");
      }).catch(() => setPhase("found"));
    });

    return () => { socket.off("ride:driver-accepted"); };
  }, [rideId]);

  useEffect(() => {
    if (phase !== "found") return;
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [phase, countdown]);

  const handleCancel = async () => {
    if (rideId) {
      try { await ridesApi.cancel(rideId, "Customer cancelled"); } catch { /* ignore */ }
    }
    navigate("/customer/home");
  };

  return (
    <div className="relative h-full w-full bg-white flex flex-col overflow-hidden">
      <div className="flex-1 relative">
        <MapView
          markers={phase === "searching" ? SEARCHING_MARKERS : MARKERS}
          showDriverMoving={phase === "searching"}
          className="w-full h-full"
          label="Poblacion Area"
        />
        <button
          onClick={() => navigate("/customer/home")}
          className="absolute top-12 left-4 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center z-10"
        >
          <ChevronLeft className="w-4 h-4 text-gray-700" />
        </button>

        {phase === "searching" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border-2 border-[#F47920]"
                initial={{ width: 40, height: 40, opacity: 0.8 }}
                animate={{ width: 130, height: 130, opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
              />
            ))}
            <div className="w-12 h-12 bg-[#F47920] rounded-full flex items-center justify-center shadow-lg z-10">
              <span className="text-2xl">🛺</span>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {phase === "searching" ? (
          <motion.div
            key="searching"
            initial={{ y: 200 }}
            animate={{ y: 0 }}
            exit={{ y: 200 }}
            className="bg-white rounded-t-3xl shadow-2xl px-5 pt-4 pb-8"
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full bg-[#F47920]/10 flex items-center justify-center">
                  <span className="text-3xl">🛺</span>
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-5 h-5 bg-[#F47920] rounded-full flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                >
                  <div className="w-2 h-2 bg-white rounded-full" />
                </motion.div>
              </div>
              <div className="flex-1">
                <h3 className="text-gray-800 font-bold text-base">Naghahanap ng tricycle...</h3>
                <p className="text-gray-400 text-sm">Kinokonekta ka sa pinakamalapit na driver</p>
              </div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                className="w-8 h-8 rounded-full border-2 border-[#F47920] border-t-transparent"
              />
            </div>

            <div className="mt-4 bg-gray-50 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-gray-500">Pickup: {pickupText}</span>
              </div>
              <div className="w-px h-3 bg-gray-300 ml-[3px]" />
              <div className="flex items-center gap-2 mt-1">
                <MapPin className="w-2 h-2 text-[#F47920]" />
                <span className="text-xs text-gray-500">Dropoff: {dropoffText}</span>
              </div>
            </div>

            <button
              onClick={handleCancel}
              className="mt-4 w-full py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" /> Kanselahin ang Booking
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="found"
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-white rounded-t-3xl shadow-2xl px-5 pt-4 pb-8"
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />

            <div className="flex items-center gap-1 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-600 text-xs font-semibold">Nahanap ang Driver!</span>
            </div>

            <div className="flex items-center gap-3 mb-4">
              <div className="relative">
                <img src={DRIVER_IMAGE} alt="Driver" className="w-14 h-14 rounded-full object-cover border-2 border-[#F47920]" />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full px-1.5 py-0.5 shadow text-[9px] font-bold text-[#F47920] border border-orange-100">
                  ★ 4.8
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-gray-800 font-bold text-base">
                  {rideData ? `${rideData.driver_first_name} ${rideData.driver_last_name}` : "Naglo-load..."}
                </h3>
                <p className="text-gray-500 text-xs">Tricycle · <span className="font-semibold text-gray-700">{rideData?.plate_number || "---"}</span></p>
                <p className="text-xs text-[#F47920] font-medium mt-0.5">Darating sa {countdown}s</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <button className="w-9 h-9 rounded-full bg-[#F47920]/10 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-[#F47920]" />
                </button>
                <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center justify-between mb-4">
              <div>
                <p className="text-xs text-gray-400">Estimated Fare</p>
                <p className="text-gray-800 font-bold text-xl">₱ {rideData ? rideData.fare_amount.toFixed(2) : "--"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Distance</p>
                <p className="text-gray-700 font-semibold text-sm">{rideData ? `${rideData.distance_km} km` : "--"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Est. Time</p>
                <p className="text-gray-700 font-semibold text-sm">~8 min</p>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/customer/ride", { state: { rideId, rideData } })}
              className="w-full bg-[#F47920] text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-orange-200"
            >
              Simulan ang Sakay 🛺
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}