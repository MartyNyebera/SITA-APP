import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, ChevronRight, Bell, Navigation, Clock, X } from "lucide-react";
import { MapView } from "../../components/MapView";
import { CustomerNav } from "../../components/CustomerNav";
import { getStoredUser, ridesApi, type UserData, type RideData } from "../../services/api";
import { customerWatchDrivers, getSocket } from "../../services/socket";

const QUICK_DESTINATIONS = [
  { icon: "🏠", label: "Home", address: "Blk 5 Lot 12, Brgy. San Jose" },
  { icon: "💼", label: "Work", address: "Municipal Hall, Poblacion" },
  { icon: "🏥", label: "Health Center", address: "Brgy. Health Center, Purok 3" },
  { icon: "🛒", label: "Palengke", address: "Public Market, Poblacion" },
];

const RECENT = [
  { place: "Covered Court, Brgy. Sta. Cruz", address: "Purok 2, Sta. Cruz" },
  { place: "Elementary School", address: "Brgy. San Roque, Purok 1" },
];

const DEFAULT_MARKERS = [
  { x: 50, y: 56, type: "pickup" as const },
  { x: 32, y: 38, type: "driver" as const },
  { x: 68, y: 74, type: "driver2" as const },
  { x: 15, y: 56, type: "driver3" as const },
];

const CUSTOMER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23E5E7EB'/%3E%3Cpath d='M50 45c8.284 0 15-6.716 15-15s-6.716-15-15-15-15 6.716-15 15 6.716 15 15 15zM50 50c-16.569 0-30 10.745-30 24v6h60v-6c0-13.255-13.431-24-30-24z' fill='%239CA3AF'/%3E%3C/svg%3E";

export function CustomerHome() {
  const navigate = useNavigate();
  const [searchFocused, setSearchFocused] = useState(false);
  const [pickup, setPickup] = useState("Current Location");
  const [dropoff, setDropoff] = useState("");
  const [activeField, setActiveField] = useState<"pickup" | "dropoff">("dropoff");
  const [nearbyCount, setNearbyCount] = useState(0);
  const [booking, setBooking] = useState(false);
  const [bookError, setBookError] = useState("");

  const user = getStoredUser<UserData>();
  const displayName = user ? `${user.first_name} ${user.last_name}` : "Pasahero";

  useEffect(() => {
    const socket = getSocket();
    customerWatchDrivers();
    socket.on("drivers:snapshot", (data: { drivers: { available: boolean }[] }) => {
      setNearbyCount(data.drivers.filter((d) => d.available).length);
    });
    socket.on("drivers:updated", () => {
      customerWatchDrivers();
    });
    return () => {
      socket.off("drivers:snapshot");
      socket.off("drivers:updated");
    };
  }, []);

  const handleDestinationSelect = (address: string) => {
    if (activeField === "pickup") setPickup(address);
    else setDropoff(address);
    setSearchFocused(false);
  };

  const handleBookNow = async () => {
    if (!dropoff || booking) return;
    setBookError("");
    setBooking(true);
    try {
      const res = await ridesApi.create({
        pickupAddress: pickup,
        pickupLatitude: 14.5995,
        pickupLongitude: 120.9842,
        dropoffAddress: dropoff,
        dropoffLatitude: 14.6010,
        dropoffLongitude: 120.9870,
        paymentMethod: "cash",
      });
      const ride: RideData = res.data;
      navigate("/customer/finding", { state: { rideId: ride.id, pickup, dropoff } });
    } catch (err) {
      setBookError(err instanceof Error ? err.message : "Booking failed");
      setBooking(false);
    }
  };

  return (
    <div className="relative h-full w-full flex flex-col bg-white overflow-hidden">
      {/* Map */}
      <div className="absolute inset-0">
        <MapView markers={DEFAULT_MARKERS} showDriverMoving className="w-full h-full" label="Poblacion Area" />
      </div>

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-12 pb-3">
        <div>
          <p className="text-xs text-gray-600 font-medium">Magandang umaga 👋</p>
          <h1 className="text-gray-900 font-bold text-lg">{displayName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center">
            <Bell className="w-4 h-4 text-gray-700" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#F47920] rounded-full border border-white" />
          </button>
          <img src={CUSTOMER_IMAGE} alt="Profile" className="w-9 h-9 rounded-full object-cover border-2 border-[#F47920] shadow-md" />
        </div>
      </div>

      {/* Nearby drivers badge */}
      <div className="relative z-10 mx-4 mb-3">
        <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 inline-flex items-center gap-2 shadow-sm">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs text-gray-700 font-medium">{nearbyCount > 0 ? `${nearbyCount} tricycles nearby · ~3 min ETA` : "Naghahanap ng tricycle..."}</span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Bottom Booking Sheet */}
      <AnimatePresence>
        {!searchFocused ? (
          <motion.div
            key="collapsed"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="relative z-10 bg-white rounded-t-3xl shadow-2xl px-4 pt-4 pb-24"
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-gray-800 font-bold text-base">Saan tayo?</h2>
              <div className="bg-[#F47920]/10 rounded-full px-2.5 py-1">
                <span className="text-[#F47920] text-xs font-semibold">🛺 Tricycle</span>
              </div>
            </div>

            {/* Pickup */}
            <div
              className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 mb-2 cursor-pointer"
              onClick={() => { setActiveField("pickup"); setSearchFocused(true); }}
            >
              <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow" />
              <span className="flex-1 text-sm text-gray-700 truncate">{pickup}</span>
              <Navigation className="w-3.5 h-3.5 text-[#F47920]" />
            </div>

            {/* Dropoff */}
            <div
              className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5 mb-4 cursor-pointer"
              onClick={() => { setActiveField("dropoff"); setSearchFocused(true); }}
            >
              <MapPin className="w-3.5 h-3.5 text-[#F47920]" />
              <span className={`flex-1 text-sm truncate ${dropoff ? "text-gray-700" : "text-gray-400"}`}>
                {dropoff || "Saan pupunta?"}
              </span>
              {dropoff && (
                <button onClick={(e) => { e.stopPropagation(); setDropoff(""); }}>
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>

            {/* Quick destinations */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {QUICK_DESTINATIONS.map((dest) => (
                <button
                  key={dest.label}
                  onClick={() => { setActiveField("dropoff"); handleDestinationSelect(dest.address); }}
                  className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 text-left hover:bg-orange-50 transition-colors border border-gray-100"
                >
                  <span className="text-base">{dest.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-700">{dest.label}</p>
                    <p className="text-[10px] text-gray-400 truncate">{dest.address.split(",")[0]}</p>
                  </div>
                </button>
              ))}
            </div>

            {bookError && (
              <p className="text-red-500 text-xs text-center mb-2">{bookError}</p>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleBookNow}
              disabled={!dropoff || booking}
              className={`w-full py-3.5 rounded-2xl font-bold text-base transition-all ${dropoff && !booking ? "bg-[#F47920] text-white shadow-lg shadow-orange-200" : "bg-gray-100 text-gray-400"}`}
            >
              {booking ? "Nagbo-book..." : dropoff ? "Mag-Book ng Tricycle" : "Pumili ng Destinasyon"}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="search"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="absolute inset-0 z-20 bg-white flex flex-col"
          >
            <div className="pt-12 px-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <button onClick={() => setSearchFocused(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
                <h2 className="font-bold text-gray-800">{activeField === "pickup" ? "Set Pickup" : "Piliin ang Destinasyon"}</h2>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 border border-[#F47920] rounded-xl px-3 py-2.5">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  autoFocus
                  placeholder={activeField === "pickup" ? "Pickup location..." : "Search destination..."}
                  className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>

            <div className="px-4 pt-4 flex-1 overflow-auto">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">Recent</p>
              {RECENT.map((r, i) => (
                <button key={i} onClick={() => handleDestinationSelect(r.place)} className="w-full flex items-center gap-3 py-3 border-b border-gray-50">
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800">{r.place}</p>
                    <p className="text-xs text-gray-400">{r.address}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                </button>
              ))}

              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mt-4 mb-3">Mga Lugar</p>
              {QUICK_DESTINATIONS.map((d) => (
                <button key={d.label} onClick={() => handleDestinationSelect(d.address)} className="w-full flex items-center gap-3 py-3 border-b border-gray-50">
                  <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">{d.icon}</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800">{d.label}</p>
                    <p className="text-xs text-gray-400">{d.address}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CustomerNav />
    </div>
  );
}