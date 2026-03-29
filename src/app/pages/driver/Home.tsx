import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Bell, TrendingUp, Zap } from "lucide-react";
import { MapView } from "../../components/MapView";
import { DriverNav } from "../../components/DriverNav";
import { getStoredUser, driversApi, type DriverData } from "../../services/api";
import { driverGoOnline, driverGoOffline, getSocket } from "../../services/socket";

const DRIVER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23E5E7EB'/%3E%3Cpath d='M50 45c8.284 0 15-6.716 15-15s-6.716-15-15-15-15 6.716-15 15 6.716 15 15 15zM50 50c-16.569 0-30 10.745-30 24v6h60v-6c0-13.255-13.431-24-30-24z' fill='%239CA3AF'/%3E%3C/svg%3E";

const DRIVER_MARKERS = [
  { x: 50, y: 56, type: "driver" as const },
];

const TIPS = [
  "Mga mataong oras: 6–9 AM at 4–7 PM",
  "Pinakamataong lugar: Palengke at paaralan",
  "Kumita ng mas malaki sa weekend!",
];

export function DriverHome() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(false);
  const [tipIndex] = useState(0);
  const [incomingRide, setIncomingRide] = useState<null | { pickupAddress: string; dropoffAddress: string }>(null);

  const driver = getStoredUser<DriverData>();
  const displayName = driver ? `${driver.first_name} ${driver.last_name}` : "Driver";
  const driverId = driver?.id;

  useEffect(() => {
    const socket = getSocket();
    socket.on("ride:available", (data: { pickupAddress: string; dropoffAddress: string }) => {
      setIncomingRide(data);
    });
    return () => { socket.off("ride:available"); };
  }, []);

  const handleToggleOnline = async () => {
    if (!driverId) return;
    const next = !isOnline;
    setIsOnline(next);
    try {
      if (next) {
        driverGoOnline(driverId, 14.5995, 120.9842);
      } else {
        driverGoOffline(driverId);
      }
      await driversApi.updateStatus(driverId, next);
    } catch {
      setIsOnline(!next);
    }
  };

  return (
    <div className="relative h-full w-full flex flex-col bg-[#1a1a2e] overflow-hidden">
      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <img src={DRIVER_IMAGE} alt="Driver" className="w-10 h-10 rounded-full object-cover border-2 border-[#F47920]" />
          <div>
            <p className="text-gray-400 text-xs">Magandang araw 🛺</p>
            <h1 className="text-white font-bold text-base">{displayName}</h1>
          </div>
        </div>
        <button className="relative w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
          <Bell className="w-4 h-4 text-white" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#F47920] rounded-full border border-[#1a1a2e]" />
        </button>
      </div>

      {/* Online/Offline Toggle */}
      <div className="relative z-10 px-4 mb-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white font-bold text-base">{isOnline ? "Online — Tumatanggap ng Booking" : "Offline"}</p>
              <p className="text-gray-400 text-xs">{isOnline ? "Maaari kang matawagan ng mga pasahero" : "I-on para makatanggap ng booking"}</p>
            </div>
            <button
              onClick={handleToggleOnline}
              className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isOnline ? "bg-green-500" : "bg-gray-600"}`}
            >
              <motion.div
                animate={{ x: isOnline ? 28 : 4 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow"
              />
            </button>
          </div>

          {/* Status indicator */}
          <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${isOnline ? "bg-green-500/20" : "bg-gray-700/50"}`}>
            <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-400 animate-pulse" : "bg-gray-500"}`} />
            <span className={`text-xs font-semibold ${isOnline ? "text-green-400" : "text-gray-400"}`}>
              {isOnline ? "Handa kang sumagot ng booking" : "Wala kang matatanggap na booking"}
            </span>
          </div>
        </div>
      </div>

      {/* Today's Earnings */}
      <div className="relative z-10 px-4 mb-4">
        <div className="bg-[#F47920] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-orange-100 text-xs font-semibold uppercase tracking-wide">Kita Ngayon</p>
            <TrendingUp className="w-4 h-4 text-orange-100" />
          </div>
          <p className="text-white font-black text-3xl mb-1">₱ 185.00</p>
          <p className="text-orange-200 text-xs">+₱45 kumpara sa kahapon</p>

          <div className="flex gap-3 mt-3">
            <div className="flex-1 bg-white/20 rounded-xl p-2.5 text-center">
              <p className="text-white font-bold text-base">7</p>
              <p className="text-orange-200 text-[10px]">Mga Biyahe</p>
            </div>
            <div className="flex-1 bg-white/20 rounded-xl p-2.5 text-center">
              <p className="text-white font-bold text-base">12.4</p>
              <p className="text-orange-200 text-[10px]">Km Nasakay</p>
            </div>
            <div className="flex-1 bg-white/20 rounded-xl p-2.5 text-center">
              <p className="text-white font-bold text-base">4.8★</p>
              <p className="text-orange-200 text-[10px]">Avg Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="relative z-10 flex-1 mx-4 rounded-2xl overflow-hidden">
        <MapView markers={DRIVER_MARKERS} showDriverMoving={isOnline} className="w-full h-full" label="Inyong Lokasyon" />

        {isOnline && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md"
            >
              <p className="text-[10px] text-gray-500 font-medium">Naghahanap ng pasahero...</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <p className="text-xs font-semibold text-gray-700">Online</p>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {isOnline && incomingRide && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/driver/request")}
            className="absolute bottom-3 left-3 right-3 bg-[#F47920] text-white py-3 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            May Bagong Booking! I-tingnan →
          </motion.button>
        )}
      </div>

      {/* Tip */}
      <div className="relative z-10 mx-4 mt-3 mb-20">
        <div className="bg-white/5 rounded-xl px-3 py-2.5 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[#F47920] flex-shrink-0" />
          <p className="text-gray-400 text-xs">{TIPS[tipIndex]}</p>
        </div>
      </div>

      <DriverNav />
    </div>
  );
}