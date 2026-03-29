import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { CheckCircle, TrendingUp, MapPin, Clock, Star } from "lucide-react";
import { getStoredUser, type DriverData, type RideData } from "../../services/api";

const CUSTOMER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23E5E7EB'/%3E%3Cpath d='M50 45c8.284 0 15-6.716 15-15s-6.716-15-15-15-15 6.716-15 15 6.716 15 15 15zM50 50c-16.569 0-30 10.745-30 24v6h60v-6c0-13.255-13.431-24-30-24z' fill='%239CA3AF'/%3E%3C/svg%3E";

export function DriverRideDone() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { rideId?: string; rideData?: RideData } | null;
  const rideData = state?.rideData;
  const driver = getStoredUser<DriverData>();
  const driverPayout = rideData ? (rideData.fare_amount * 0.85).toFixed(2) : "--";
  const displayName = driver ? driver.first_name : "Driver";

  return (
    <div className="h-full w-full bg-[#1a1a2e] flex flex-col overflow-hidden">
      {/* Success header */}
      <div className="bg-gradient-to-b from-[#F47920] to-[#e06810] pt-12 pb-16 px-5 text-center relative">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-[#F47920]"
        >
          <CheckCircle className="w-9 h-9 text-[#F47920]" />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-white font-black text-2xl mb-1">
          Tapos na ang Biyahe!
        </motion.h1>
        <p className="text-orange-100 text-sm">Magandang trabaho, {displayName}! 👍</p>
      </div>

      <div className="flex-1 overflow-auto px-5 pt-12 pb-6">
        {/* Earnings highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#F47920]/20 border border-[#F47920]/30 rounded-2xl p-5 mb-4 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-[#F47920]" />
            <p className="text-[#F47920] text-xs font-semibold uppercase tracking-wide">Kinita Mo</p>
          </div>
          <p className="text-white font-black text-4xl">₱ {driverPayout}</p>
          <p className="text-gray-400 text-xs mt-1">{rideData?.payment_method || "Cash"} payment · Huwag kalimutang kolektahin</p>
        </motion.div>

        {/* Trip summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 rounded-2xl p-4 mb-4"
        >
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Buod ng Biyahe</p>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <MapPin className="w-4 h-4 text-[#F47920] mx-auto mb-1" />
              <p className="text-[10px] text-gray-400">Distansya</p>
              <p className="text-sm font-bold text-white">{rideData ? `${rideData.distance_km} km` : "--"}</p>
            </div>
            <div className="text-center border-x border-white/10">
              <Clock className="w-4 h-4 text-[#F47920] mx-auto mb-1" />
              <p className="text-[10px] text-gray-400">Tagal</p>
              <p className="text-sm font-bold text-white">8 min</p>
            </div>
            <div className="text-center">
              <Star className="w-4 h-4 text-yellow-400 mx-auto mb-1" />
              <p className="text-[10px] text-gray-400">Rating</p>
              <p className="text-sm font-bold text-white">★ 5.0</p>
            </div>
          </div>
        </motion.div>

        {/* Passenger info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white/10 rounded-2xl p-4 mb-4"
        >
          <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-3">Pasahero</p>
          <div className="flex items-center gap-3">
            <img src={CUSTOMER_IMAGE} alt="Customer" className="w-12 h-12 rounded-full object-cover border-2 border-[#F47920]" />
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{rideData ? `${rideData.customer_first_name} ${rideData.customer_last_name}` : "Pasahero"}</p>
              <p className="text-gray-400 text-xs">★ 4.9 · Verified Passenger</p>
            </div>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Today's total */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/10 rounded-2xl p-4 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs">Kabuuang Kita Ngayon</p>
              <p className="text-white font-black text-2xl">₱ 220.00</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-xs">Mga Biyahe Ngayon</p>
              <p className="text-white font-bold text-xl">8</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl mt-3 px-3 py-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <p className="text-green-400 text-xs font-medium">+₱35 kita ngayong biyahe</p>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/driver/home")}
          className="w-full bg-[#F47920] text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-orange-900/30 mb-3"
        >
          Handa para sa Susunod na Biyahe 🛺
        </motion.button>

        <button
          onClick={() => navigate("/driver/earnings")}
          className="w-full py-3 rounded-2xl border border-white/20 text-gray-300 text-sm font-semibold"
        >
          Tingnan ang Lahat ng Kita
        </button>
      </div>
    </div>
  );
}