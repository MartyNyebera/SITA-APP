import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Phone, MessageCircle, MapPin, AlertTriangle, X } from "lucide-react";
import { MapView } from "../../components/MapView";
import { SOSModal } from "../../components/SOSModal";
import { ridesApi, type RideData } from "../../services/api";
import { getSocket } from "../../services/socket";

const DRIVER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23E5E7EB'/%3E%3Cpath d='M50 45c8.284 0 15-6.716 15-15s-6.716-15-15-15-15 6.716-15 15 6.716 15 15 15zM50 50c-16.569 0-30 10.745-30 24v6h60v-6c0-13.255-13.431-24-30-24z' fill='%239CA3AF'/%3E%3C/svg%3E";

const RIDE_STEPS = [
  "Driver paparating na sa pickup...",
  "Driver nakarating na sa inyong lugar",
  "Sakay na! Papuntang destinasyon 🛺",
  "Malapit na sa destinasyon",
];

const MARKERS_PROGRESS = [
  [
    { x: 50, y: 56, type: "pickup" as const },
    { x: 68, y: 74, type: "dropoff" as const },
    { x: 40, y: 60, type: "driver" as const },
  ],
  [
    { x: 50, y: 56, type: "pickup" as const },
    { x: 68, y: 74, type: "dropoff" as const },
    { x: 50, y: 56, type: "driver" as const },
  ],
  [
    { x: 50, y: 56, type: "pickup" as const },
    { x: 68, y: 74, type: "dropoff" as const },
    { x: 58, y: 62, type: "driver" as const },
  ],
  [
    { x: 50, y: 56, type: "pickup" as const },
    { x: 68, y: 74, type: "dropoff" as const },
    { x: 66, y: 71, type: "driver" as const },
  ],
];

export function CustomerRide() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { rideId?: string; rideData?: RideData } | null;
  const rideId = state?.rideId;
  const initialRide = state?.rideData;

  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showSOS, setShowSOS] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [rideData, setRideData] = useState<RideData | null>(initialRide || null);

  useEffect(() => {
    const interval = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!rideId) return;
    const socket = getSocket();
    socket.on("ride:status-update", (data: { status: string }) => {
      const statusMap: Record<string, number> = {
        accepted: 0, arrived: 1, in_progress: 2, completed: 3,
      };
      const newStep = statusMap[data.status];
      if (newStep !== undefined) setStep(newStep);
    });
    socket.on("driver:arrived-at-pickup", () => setStep(1));
    socket.on("ride:started", () => setStep(2));
    socket.on("ride:completed", () => {
      navigate("/customer/complete", { state: { rideId, rideData } });
    });
    socket.on("driver:near-dropoff", () => setStep(3));
    return () => {
      socket.off("ride:status-update");
      socket.off("driver:arrived-at-pickup");
      socket.off("ride:started");
      socket.off("ride:completed");
      socket.off("driver:near-dropoff");
    };
  }, [rideId, navigate, rideData]);

  useEffect(() => {
    if (rideId && !rideData) {
      ridesApi.get(rideId).then((res) => setRideData(res.data)).catch(() => {});
    }
  }, [rideId, rideData]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const isNearEnd = step >= 3;

  return (
    <div className="relative h-full w-full bg-white flex flex-col overflow-hidden">
      <div className="flex-1 relative">
        <MapView markers={MARKERS_PROGRESS[step]} className="w-full h-full" label="Poblacion Area" />

        {/* Safety badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-12 left-0 right-0 flex justify-center"
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-2 shadow-md">
            <Shield className="w-3.5 h-3.5 text-green-500" />
            <span className="text-xs font-semibold text-gray-700">Sakay Protektado · SITA Insured</span>
          </div>
        </motion.div>

        {/* SOS Button - Fixed on top right */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSOS(true)}
          className="absolute top-12 right-4 w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-900/40 animate-pulse"
        >
          <AlertTriangle className="w-6 h-6 text-white" />
        </motion.button>

        {/* Timer */}
        <div className="absolute top-24 left-4 bg-[#1a1a2e]/80 backdrop-blur-sm rounded-xl px-3 py-2">
          <p className="text-[10px] text-gray-400">Oras na Lumipas</p>
          <p className="text-white font-bold text-sm">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </p>
        </div>

        {/* Status badge */}
        <div className="absolute bottom-4 left-4 right-4">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg ${step >= 2 ? "bg-[#F47920]" : "bg-[#1a1a2e]/90"}`}
          >
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <p className="text-white text-xs font-semibold">{RIDE_STEPS[step]}</p>
          </motion.div>
        </div>
      </div>

      {/* Driver panel */}
      <div className="bg-white rounded-t-3xl shadow-2xl px-5 pt-3 pb-6">
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />

        <div className="flex items-center gap-3 mb-4">
          <img src={DRIVER_IMAGE} alt="Driver" className="w-12 h-12 rounded-full object-cover border-2 border-[#F47920]" />
          <div className="flex-1">
            <p className="text-gray-800 font-bold text-sm">
              {rideData ? `${rideData.driver_first_name} ${rideData.driver_last_name}` : "Driver"}
            </p>
            <p className="text-gray-400 text-xs">Tricycle · {rideData?.plate_number || "---"}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-yellow-400 text-xs">★</span>
              <span className="text-gray-600 text-xs font-semibold">4.8</span>
              <span className="text-gray-400 text-xs">· 1,204 trips</span>
            </div>
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

        {/* Route */}
        <div className="bg-gray-50 rounded-2xl px-4 py-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <p className="text-xs text-gray-500">Pickup: {rideData?.pickup_address || "Current Location"}</p>
            </div>
          </div>
          <div className="w-px h-4 bg-gray-200 ml-[3px] mb-2" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 text-[#F47920]" />
              <p className="text-xs text-gray-500">{rideData?.dropoff_address || "Destinasyon"}</p>
            </div>
            <span className="text-xs font-semibold text-gray-700">{rideData ? `${rideData.distance_km} km` : "--"}</span>
          </div>
        </div>

        {/* Fare */}
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <p className="text-xs text-gray-400">Estimated Fare</p>
            <p className="text-2xl font-black text-gray-800">₱ {rideData ? rideData.fare_amount.toFixed(2) : "--"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">ETA</p>
            <p className="text-gray-700 font-bold text-base">~{Math.max(0, 8 - Math.floor(elapsed / 60))} min</p>
          </div>
        </div>

        {isNearEnd ? (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/customer/complete")}
            className="w-full bg-[#F47920] text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-orange-200"
          >
            Nakarating Na — Tapusin ang Sakay
          </motion.button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex-1 py-3 rounded-xl bg-red-50 text-red-600 text-sm font-semibold"
            >
              Cancel Ride
            </button>
            <button className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold">
              Ibahagi ang Sakay
            </button>
          </div>
        )}
      </div>

      {/* SOS Modal */}
      <AnimatePresence>
        {showSOS && <SOSModal onClose={() => setShowSOS(false)} />}
      </AnimatePresence>

      {/* Cancel Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="w-6 h-6 text-red-600" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
                Cancel Ride?
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Sigurado ka bang gusto mong kanselahin ang sakay? May maliit na cancellation fee.
              </p>

              {/* Cancellation Fee Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6">
                <p className="text-xs text-amber-800 font-semibold mb-1">Cancellation Fee</p>
                <p className="text-2xl font-bold text-amber-900">₱ 20.00</p>
                <p className="text-[10px] text-amber-700 mt-1">
                  Para sa abala ng driver at para protektado ang lahat
                </p>
              </div>

              <div className="space-y-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={async () => {
                    setShowCancelModal(false);
                    if (rideId) {
                      try { await ridesApi.cancel(rideId, "Customer cancelled"); } catch { /* ignore */ }
                    }
                    navigate("/customer/home");
                  }}
                  className="w-full bg-red-600 text-white font-bold py-3 rounded-xl"
                >
                  Oo, Cancel Ride
                </motion.button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl"
                >
                  Bumalik sa Ride
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}