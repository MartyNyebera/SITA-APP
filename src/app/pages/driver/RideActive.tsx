import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { MapPin, Phone, MessageCircle, Navigation, CheckCircle } from "lucide-react";
import { MapView } from "../../components/MapView";
import { getStoredUser, ridesApi, type DriverData, type RideData } from "../../services/api";
import { driverStartRide, driverCompleteRide } from "../../services/socket";

const CUSTOMER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23E5E7EB'/%3E%3Cpath d='M50 45c8.284 0 15-6.716 15-15s-6.716-15-15-15-15 6.716-15 15 6.716 15 15 15zM50 50c-16.569 0-30 10.745-30 24v6h60v-6c0-13.255-13.431-24-30-24z' fill='%239CA3AF'/%3E%3C/svg%3E";

type Phase = "heading_pickup" | "at_pickup" | "in_ride";

const PHASE_CONFIG = {
  heading_pickup: {
    label: "Papunta sa Pickup Point",
    sublabel: "Hanapin si Maria A. Santos",
    color: "#1a1a2e",
    btnLabel: "Nakarating na sa Pickup",
    btnColor: "bg-blue-600",
  },
  at_pickup: {
    label: "Nakarating sa Pickup!",
    sublabel: "Hintayin ang pasahero na sumakay",
    color: "#22c55e",
    btnLabel: "Pasahero Nakasakay — Simulan ang Biyahe",
    btnColor: "bg-[#F47920]",
  },
  in_ride: {
    label: "Biyahe Ongoing 🛺",
    sublabel: "Papunta sa Municipal Hall, Poblacion",
    color: "#F47920",
    btnLabel: "Nakarating — Tapusin ang Biyahe",
    btnColor: "bg-green-600",
  },
};

const MARKERS_BY_PHASE = {
  heading_pickup: [
    { x: 50, y: 56, type: "pickup" as const },
    { x: 68, y: 74, type: "dropoff" as const },
    { x: 35, y: 45, type: "driver" as const },
  ],
  at_pickup: [
    { x: 50, y: 56, type: "pickup" as const },
    { x: 68, y: 74, type: "dropoff" as const },
    { x: 50, y: 56, type: "driver" as const },
  ],
  in_ride: [
    { x: 50, y: 56, type: "pickup" as const },
    { x: 68, y: 74, type: "dropoff" as const },
    { x: 60, y: 64, type: "driver" as const },
  ],
};

export function DriverRideActive() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { rideId?: string } | null;
  const rideId = state?.rideId;

  const [phase, setPhase] = useState<Phase>("heading_pickup");
  const [elapsed, setElapsed] = useState(0);
  const [rideData, setRideData] = useState<RideData | null>(null);

  const driver = getStoredUser<DriverData>();
  const driverId = driver?.id;

  useEffect(() => {
    if (rideId) {
      ridesApi.get(rideId).then((res) => setRideData(res.data)).catch(() => {});
    }
  }, [rideId]);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const config = PHASE_CONFIG[phase];

  const handleNext = async () => {
    if (phase === "heading_pickup") {
      if (rideId) {
        try { await ridesApi.arrived(rideId); } catch { /* ignore */ }
      }
      setPhase("at_pickup");
    } else if (phase === "at_pickup") {
      if (rideId && driverId) {
        try {
          driverStartRide(driverId, rideId);
          await ridesApi.start(rideId);
        } catch { /* ignore */ }
      }
      setPhase("in_ride");
    } else {
      if (rideId && driverId) {
        try {
          driverCompleteRide(driverId, rideId);
          await ridesApi.complete(rideId);
        } catch { /* ignore */ }
      }
      navigate("/driver/done", { state: { rideId, rideData } });
    }
  };

  return (
    <div className="relative h-full w-full bg-white flex flex-col overflow-hidden">
      {/* Map */}
      <div className="flex-1 relative">
        <MapView markers={MARKERS_BY_PHASE[phase]} className="w-full h-full" label="Poblacion Area" />

        {/* Phase status badge */}
        <motion.div
          key={phase}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-12 left-0 right-0 flex justify-center"
        >
          <div
            className="rounded-full px-4 py-2 flex items-center gap-2 shadow-lg"
            style={{ backgroundColor: config.color }}
          >
            {phase === "in_ride" && <div className="w-2 h-2 bg-white rounded-full animate-pulse" />}
            {phase === "at_pickup" && <CheckCircle className="w-3.5 h-3.5 text-white" />}
            {phase === "heading_pickup" && <Navigation className="w-3.5 h-3.5 text-white" />}
            <span className="text-white text-xs font-bold">{config.label}</span>
          </div>
        </motion.div>

        {/* Timer */}
        <div className="absolute top-24 right-4 bg-[#1a1a2e]/80 backdrop-blur-sm rounded-xl px-3 py-2">
          <p className="text-[10px] text-gray-400">Oras</p>
          <p className="text-white font-bold text-sm">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
        </div>
      </div>

      {/* Driver bottom panel */}
      <div className="bg-white rounded-t-3xl shadow-2xl px-5 pt-3 pb-6">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

        {/* Customer info */}
        <div className="flex items-center gap-3 mb-4">
          <img src={CUSTOMER_IMAGE} alt="Customer" className="w-12 h-12 rounded-full object-cover border-2 border-[#F47920]" />
          <div className="flex-1">
            <p className="text-gray-800 font-bold text-sm">
              {rideData ? `${rideData.customer_first_name} ${rideData.customer_last_name}` : "Pasahero"}
            </p>
            <p className="text-gray-500 text-xs">Verified Passenger</p>
            <p className="text-xs text-gray-400 mt-0.5">{config.sublabel}</p>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-[#F47920]/10 flex items-center justify-center">
              <Phone className="w-4 h-4 text-[#F47920]" />
            </button>
            <button className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Phase progress indicators */}
        <div className="flex items-center gap-2 mb-4">
          {(["heading_pickup", "at_pickup", "in_ride"] as Phase[]).map((p, i) => (
            <div key={p} className="flex items-center flex-1">
              <div className={`flex-1 h-1.5 rounded-full ${
                phase === p ? "bg-[#F47920]" :
                (["heading_pickup", "at_pickup", "in_ride"].indexOf(phase) > i) ? "bg-[#F47920]" : "bg-gray-200"
              }`} />
              {i < 2 && <div className="w-1" />}
            </div>
          ))}
        </div>

        {/* Route */}
        <div className="bg-gray-50 rounded-2xl px-4 py-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <p className="text-xs text-gray-500">Pickup: {rideData?.pickup_address || "---"}</p>
          </div>
          <div className="w-px h-3 bg-gray-300 ml-[3px]" />
          <div className="flex items-center gap-2 mt-2">
            <MapPin className="w-2.5 h-2.5 text-[#F47920]" />
            <p className="text-xs text-gray-500">Dropoff: {rideData?.dropoff_address || "---"}</p>
          </div>
        </div>

        {/* Fare */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <p className="text-xs text-gray-400">Kita Mo</p>
            <p className="text-2xl font-black text-[#F47920]">₱ {rideData ? (rideData.fare_amount * 0.85).toFixed(2) : "--"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Distansya</p>
            <p className="text-gray-700 font-bold text-base">{rideData ? `${rideData.distance_km} km` : "--"}</p>
          </div>
        </div>

        {/* Action button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          className={`w-full ${config.btnColor} text-white py-4 rounded-2xl font-bold text-sm shadow-lg`}
        >
          {config.btnLabel}
        </motion.button>
      </div>
    </div>
  );
}