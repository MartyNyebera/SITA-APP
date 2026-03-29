import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Star, Filter, ChevronRight } from "lucide-react";
import { CustomerNav } from "../../components/CustomerNav";
import { getStoredUser, usersApi, type UserData, type RideData } from "../../services/api";

const DRIVER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23E5E7EB'/%3E%3Cpath d='M50 45c8.284 0 15-6.716 15-15s-6.716-15-15-15-15 6.716-15 15 6.716 15 15 15zM50 50c-16.569 0-30 10.745-30 24v6h60v-6c0-13.255-13.431-24-30-24z' fill='%239CA3AF'/%3E%3C/svg%3E";
const FILTERS = ["Lahat", "Completed", "Cancelled"];

export function CustomerHistory() {
  const [activeFilter, setActiveFilter] = useState("Lahat");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [trips, setTrips] = useState<RideData[]>([]);
  const [loading, setLoading] = useState(true);

  const user = getStoredUser<UserData>();

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    usersApi.getRides(user.id)
      .then((res) => setTrips(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const filtered = trips.filter((t) => {
    if (activeFilter === "Completed") return t.status === "completed";
    if (activeFilter === "Cancelled") return t.status === "cancelled";
    return true;
  });

  const totalSpent = filtered
    .filter((t) => t.status === "completed")
    .reduce((acc, t) => acc + t.fare_amount, 0);

  return (
    <div className="h-full w-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white pt-12 px-5 pb-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-gray-800 font-bold text-xl">Kasaysayan ng Sakay</h1>
          <button className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center">
            <Filter className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="bg-gradient-to-r from-[#F47920] to-[#e06810] rounded-2xl p-4 flex justify-around mb-4">
          <div className="text-center">
            <p className="text-orange-100 text-[10px]">Total na Sakay</p>
            <p className="text-white font-black text-xl">{filtered.length}</p>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <p className="text-orange-100 text-[10px]">Kabuuang Gastos</p>
            <p className="text-white font-black text-xl">₱ {totalSpent.toFixed(0)}</p>
          </div>
          <div className="w-px bg-white/20" />
          <div className="text-center">
            <p className="text-orange-100 text-[10px]">Avg Rating</p>
            <p className="text-white font-black text-xl">4.8 ★</p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeFilter === f ? "bg-[#F47920] text-white" : "bg-gray-100 text-gray-500"}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Trip list */}
      <div className="flex-1 overflow-auto px-4 pt-4 pb-24">
        {loading && (
          <p className="text-center text-gray-400 text-sm pt-10">Naglo-load ng kasaysayan...</p>
        )}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-gray-400 text-sm pt-10">Wala pang biyahe.</p>
        )}
        {filtered.map((trip, i) => (
          <motion.div
            key={trip.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl shadow-sm mb-3 overflow-hidden"
          >
            <button className="w-full p-4" onClick={() => setExpanded(expanded === trip.id ? null : trip.id)}>
              <div className="flex items-center gap-3">
                <img src={DRIVER_IMAGE} alt="Driver" className="w-10 h-10 rounded-full object-cover border-2 border-orange-100" />
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-800">
                      {trip.driver_first_name ? `${trip.driver_first_name} ${trip.driver_last_name}` : "Driver"}
                    </p>
                    <p className="text-sm font-black text-gray-800">₱ {trip.fare_amount?.toFixed(0)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-400 capitalize">{trip.status}</p>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className="w-2.5 h-2.5 text-gray-200" />
                      ))}
                    </div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ml-1 ${expanded === trip.id ? "rotate-90" : ""}`} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex flex-col items-center gap-0.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div className="w-px h-4 bg-gray-200" />
                  <div className="w-2 h-2 rounded-full bg-[#F47920]" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 font-medium truncate">{trip.pickup_address}</p>
                  <p className="text-xs text-gray-400 truncate mt-1.5">{trip.dropoff_address}</p>
                </div>
              </div>
            </button>
            {expanded === trip.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="border-t border-gray-50 px-4 pb-4 pt-3"
              >
                <div className="flex justify-around mb-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Distansya</p>
                    <p className="text-sm font-bold text-gray-700">{trip.distance_km} km</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Bayad</p>
                    <p className="text-sm font-bold text-gray-700">₱ {trip.fare_amount?.toFixed(0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Status</p>
                    <p className="text-sm font-bold text-gray-700 capitalize">{trip.status}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <CustomerNav />
    </div>
  );
}