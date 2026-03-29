import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { TrendingUp, Calendar, ChevronRight } from "lucide-react";
import { DriverNav } from "../../components/DriverNav";
import { getStoredUser, driversApi, type DriverData, type RideData } from "../../services/api";

const PERIODS = ["Ngayon", "Linggo", "Buwan"];

const DAILY_TRIPS = [
  { time: "9:14 AM", from: "San Jose, Purok 2", to: "Municipal Hall", fare: 35, km: "1.8 km", rating: 5 },
  { time: "10:02 AM", from: "Palengke", to: "Brgy. Sta. Cruz", fare: 25, km: "1.2 km", rating: 5 },
  { time: "11:30 AM", from: "Health Center", to: "Poblacion Church", fare: 20, km: "0.9 km", rating: 4 },
  { time: "1:15 PM", from: "Elementary School", to: "San Roque", fare: 30, km: "1.5 km", rating: 5 },
  { time: "2:40 PM", from: "Brgy. San Juan", to: "Palengke", fare: 25, km: "1.1 km", rating: 5 },
  { time: "3:55 PM", from: "Municipal Hall", to: "Sta. Cruz Purok 4", fare: 30, km: "1.4 km", rating: 4 },
  { time: "5:10 PM", from: "San Jose Market", to: "Covered Court", fare: 20, km: "0.8 km", rating: 5 },
  { time: "6:20 PM", from: "Poblacion", to: "San Roque Purok 3", fare: 35, km: "1.7 km", rating: 5 },
];

const WEEKLY_SUMMARY = [
  { day: "Lun", trips: 6, earn: 165 },
  { day: "Mar", trips: 9, earn: 245 },
  { day: "Miy", trips: 7, earn: 190 },
  { day: "Huw", trips: 10, earn: 275 },
  { day: "Biy", trips: 8, earn: 220 },
  { day: "Sab", trips: 12, earn: 320 },
  { day: "Lin", trips: 5, earn: 140 },
];

const maxEarn = Math.max(...WEEKLY_SUMMARY.map((d) => d.earn));

export function DriverEarnings() {
  const [activePeriod, setActivePeriod] = useState("Ngayon");
  const [todayRides, setTodayRides] = useState<RideData[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<{
    today?: { total: number; trips: number };
    week?: { total: number; trips: number };
    month?: { total: number; trips: number };
  }>({});

  const driver = getStoredUser<DriverData>();

  useEffect(() => {
    if (!driver?.id) return;
    driversApi.getRides(driver.id)
      .then((res) => {
        const rides = (res as { data: RideData[] }).data || [];
        const today = new Date().toDateString();
        setTodayRides(rides.filter((r) => {
          const d = new Date((r as unknown as { created_at: string }).created_at);
          return d.toDateString() === today && r.status === "completed";
        }));
      })
      .catch(() => {});

    driversApi.getEarnings(driver.id, "today")
      .then((res) => {
        const d = res as { data: { today: { total: number; trips: number }; week: { total: number; trips: number }; month: { total: number; trips: number } } };
        setEarningsSummary(d.data || {});
      })
      .catch(() => {});
  }, [driver?.id]);

  const totalToday = earningsSummary.today?.total ?? DAILY_TRIPS.reduce((a, t) => a + t.fare, 0);
  const totalTripsToday = earningsSummary.today?.trips ?? DAILY_TRIPS.length;
  const totalWeek = earningsSummary.week?.total ?? WEEKLY_SUMMARY.reduce((a, d) => a + d.earn, 0);
  const totalTripsWeek = earningsSummary.week?.trips ?? WEEKLY_SUMMARY.reduce((a, d) => a + d.trips, 0);
  const totalMonth = earningsSummary.month?.total ?? 5840;
  const totalTripsMonth = earningsSummary.month?.trips ?? 47;

  return (
    <div className="h-full w-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#2d2d4e] pt-12 pb-6 px-5">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white font-bold text-lg">Aking Kita</h1>
          <button className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Earnings card */}
        <div className="bg-[#F47920] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-orange-100" />
            <p className="text-orange-100 text-xs font-semibold uppercase tracking-wide">
              {activePeriod === "Ngayon" ? "Kita Ngayon" : activePeriod === "Linggo" ? "Kita Ngayong Linggo" : "Kita Ngayong Buwan"}
            </p>
          </div>
          <p className="text-white font-black text-4xl mb-1">
            ₱ {activePeriod === "Ngayon" ? totalToday : activePeriod === "Linggo" ? totalWeek.toLocaleString() : totalMonth.toLocaleString()}
          </p>
          <div className="flex gap-4">
            <div>
              <p className="text-orange-200 text-[10px]">Mga Biyahe</p>
              <p className="text-white font-bold text-sm">
                {activePeriod === "Ngayon" ? totalTripsToday : activePeriod === "Linggo" ? totalTripsWeek : totalTripsMonth}
              </p>
            </div>
            <div>
              <p className="text-orange-200 text-[10px]">Avg per Biyahe</p>
              <p className="text-white font-bold text-sm">
                ₱ {activePeriod === "Ngayon" ? (totalTripsToday > 0 ? Math.round(totalToday / totalTripsToday) : 0) : activePeriod === "Linggo" ? (totalTripsWeek > 0 ? Math.round(totalWeek / totalTripsWeek) : 0) : (totalTripsMonth > 0 ? Math.round(totalMonth / totalTripsMonth) : 0)}
              </p>
            </div>
            <div>
              <p className="text-orange-200 text-[10px]">Completion</p>
              <p className="text-white font-bold text-sm">97%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Period filter */}
      <div className="px-5 pt-4 mb-2">
        <div className="flex bg-white rounded-2xl shadow-sm p-1 gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setActivePeriod(p)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${activePeriod === p ? "bg-[#F47920] text-white shadow-sm" : "text-gray-400"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly bar chart */}
      {activePeriod === "Linggo" && (
        <div className="px-5 mb-4">
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-4">Kita Araw-araw</p>
            <div className="flex items-end gap-2 h-20">
              {WEEKLY_SUMMARY.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(d.earn / maxEarn) * 72}px` }}
                    transition={{ delay: 0.1, type: "spring" }}
                    className="w-full rounded-t-lg"
                    style={{ backgroundColor: d.day === "Sab" ? "#F47920" : "#F47920", opacity: d.day === "Sab" ? 1 : 0.4 }}
                  />
                  <p className="text-[9px] text-gray-400 font-medium">{d.day}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Trip list */}
      {activePeriod === "Ngayon" && (
        <div className="flex-1 overflow-auto px-5 pb-24">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Mga Biyahe Ngayon</p>
          {DAILY_TRIPS.map((trip, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-2xl shadow-sm mb-2.5 p-3.5 flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-[#F47920]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🛺</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400">{trip.time} · {trip.km}</p>
                  <p className="text-[#F47920] font-black text-sm">+₱{trip.fare}</p>
                </div>
                <p className="text-xs font-semibold text-gray-700 truncate">{trip.from} → {trip.to}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={`text-[9px] ${s <= trip.rating ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                  ))}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </motion.div>
          ))}
        </div>
      )}

      {/* Monthly summary */}
      {activePeriod === "Buwan" && (
        <div className="flex-1 overflow-auto px-5 pb-24">
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-3">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Buwan ng Marso 2026</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Kabuuang Kita", value: "₱ 5,840", color: "text-[#F47920]" },
                { label: "Kabuuang Biyahe", value: "47", color: "text-gray-800" },
                { label: "Pinakamataas na Araw", value: "₱ 320 (Sab)", color: "text-green-600" },
                { label: "Avg Araw-araw", value: "₱ 187", color: "text-gray-800" },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 mb-1">{s.label}</p>
                  <p className={`font-black text-base ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#F47920] to-[#e06810] rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xl">🏆</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">Top Driver ngayong Buwan!</p>
              <p className="text-orange-100 text-xs">Ikaw ay nasa Top 10% ng mga driver</p>
            </div>
          </div>
        </div>
      )}

      {activePeriod === "Linggo" && (
        <div className="flex-1 overflow-auto px-5 pb-24">
          {WEEKLY_SUMMARY.map((d, i) => (
            <motion.div
              key={d.day}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl shadow-sm mb-2.5 p-3.5 flex items-center gap-3"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${d.day === "Sab" ? "bg-[#F47920]" : "bg-[#F47920]/10"}`}>
                <p className={`text-xs font-bold ${d.day === "Sab" ? "text-white" : "text-[#F47920]"}`}>{d.day}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-700">{d.trips} biyahe</p>
                  <p className="text-[#F47920] font-black text-sm">₱ {d.earn}</p>
                </div>
                <div className="bg-gray-100 rounded-full h-1.5 mt-1.5">
                  <div className="bg-[#F47920] h-1.5 rounded-full" style={{ width: `${(d.earn / maxEarn) * 100}%` }} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <DriverNav />
    </div>
  );
}
