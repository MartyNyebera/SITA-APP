import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, Star, ThumbsUp, MapPin, Clock, Zap } from "lucide-react";
import { ridesApi, type RideData } from "../../services/api";

const DRIVER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='50' fill='%23E5E7EB'/%3E%3Cpath d='M50 45c8.284 0 15-6.716 15-15s-6.716-15-15-15-15 6.716-15 15 6.716 15 15 15zM50 50c-16.569 0-30 10.745-30 24v6h60v-6c0-13.255-13.431-24-30-24z' fill='%239CA3AF'/%3E%3C/svg%3E";

const QUICK_TAGS = [
  "Ligtas na Driver 🛡️",
  "Nasa Oras ⏰",
  "Magalang 😊",
  "Malinis ang Sasakyan 🛺",
  "Maalam sa Daan 🗺️",
];

export function CustomerComplete() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { rideId?: string; rideData?: RideData } | null;
  const rideId = state?.rideId;
  const rideData = state?.rideData;

  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  const handleSubmit = async () => {
    if (rideId && rating > 0) {
      try { await ridesApi.rate(rideId, rating); } catch { /* ignore */ }
    }
    setSubmitted(true);
    setTimeout(() => navigate("/customer/home"), 2200);
  };

  return (
    <div className="h-full w-full bg-white flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="thanks"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center px-6"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.6 }}
              className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center mb-5"
            >
              <ThumbsUp className="w-12 h-12 text-green-500" />
            </motion.div>
            <h2 className="text-gray-800 font-black text-2xl mb-2">Salamat!</h2>
            <p className="text-gray-400 text-sm text-center">
              Ang inyong feedback ay tumutulong sa aming mga driver na makapagbigay ng mas magandang serbisyo.
            </p>
            <div className="flex gap-1 mt-4">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`w-6 h-6 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col overflow-auto">
            {/* Header */}
            <div className="bg-gradient-to-b from-[#F47920] to-[#e06810] pt-12 pb-16 px-5 text-center relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-[#F47920]"
              >
                <CheckCircle className="w-7 h-7 text-[#F47920]" />
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-white font-black text-2xl mb-1">
                Nakarating Ka Na!
              </motion.h1>
              <p className="text-orange-100 text-sm">Maligayang pagdating sa inyong destinasyon</p>
            </div>

            <div className="pt-10 px-5 pb-6">
              {/* Trip Summary */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-5">
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center">
                    <MapPin className="w-4 h-4 text-[#F47920] mx-auto mb-1" />
                    <p className="text-[10px] text-gray-400">Distansya</p>
                    <p className="text-sm font-bold text-gray-700">{rideData ? `${rideData.distance_km} km` : "--"}</p>
                  </div>
                  <div className="text-center border-x border-gray-200">
                    <Clock className="w-4 h-4 text-[#F47920] mx-auto mb-1" />
                    <p className="text-[10px] text-gray-400">Tagal</p>
                    <p className="text-sm font-bold text-gray-700">8 min</p>
                  </div>
                  <div className="text-center">
                    <Zap className="w-4 h-4 text-[#F47920] mx-auto mb-1" />
                    <p className="text-[10px] text-gray-400">Bayad</p>
                    <p className="text-sm font-bold text-gray-700">₱ {rideData ? rideData.fare_amount.toFixed(0) : "--"}</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-3 flex items-center justify-between border border-gray-100">
                  <p className="text-xs text-gray-500">Paraan ng Bayad</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">💵</span>
                    <p className="text-xs font-bold text-gray-700">Cash</p>
                  </div>
                </div>
              </div>

              {/* Driver card */}
              <div className="flex items-center gap-3 mb-5 bg-white border border-gray-100 rounded-2xl p-3 shadow-sm">
                <img src={DRIVER_IMAGE} alt="Driver" className="w-12 h-12 rounded-full object-cover border-2 border-[#F47920]" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-700">
                    {rideData ? `${rideData.driver_first_name} ${rideData.driver_last_name}` : "Driver"}
                  </p>
                  <p className="text-xs text-gray-400">Tricycle · {rideData?.plate_number || "---"}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-400">Rating ng Driver</p>
                  <p className="text-sm font-black text-[#F47920]">★ 4.8</p>
                </div>
              </div>

              {/* Rating */}
              <h3 className="text-gray-800 font-bold text-base mb-3 text-center">Kamusta ang inyong sakay?</h3>
              <div className="flex justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((s) => (
                  <motion.button
                    key={s}
                    whileTap={{ scale: 1.2 }}
                    onMouseEnter={() => setHoveredStar(s)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setRating(s)}
                    className="p-1"
                  >
                    <Star className={`w-9 h-9 transition-all ${s <= (hoveredStar || rating) ? "fill-yellow-400 text-yellow-400 scale-110" : "text-gray-200"}`} />
                  </motion.button>
                ))}
              </div>

              {rating > 0 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm font-semibold text-[#F47920] mb-4">
                  {["", "Mahirap 😞", "Pwede na 😐", "Okay 😊", "Maganda 😄", "Napakagaling! 🤩"][rating]}
                </motion.p>
              )}

              {rating >= 4 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-5">
                  <p className="text-xs text-gray-400 text-center mb-2">Ano ang nagustuhan mo? (Optional)</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {QUICK_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedTags.includes(tag) ? "bg-[#F47920] text-white border-[#F47920]" : "bg-white text-gray-600 border-gray-200"}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={rating === 0}
                className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${rating > 0 ? "bg-[#F47920] text-white shadow-lg shadow-orange-200" : "bg-gray-100 text-gray-400"}`}
              >
                {rating > 0 ? "I-submit ang Rating" : "Pumili ng bituin para i-rate"}
              </motion.button>

              <button onClick={() => navigate("/customer/home")} className="w-full py-3 text-gray-400 text-sm text-center mt-2">
                Laktawan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}