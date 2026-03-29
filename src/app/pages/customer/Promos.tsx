import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Gift, Tag, Check, X, Sparkles } from "lucide-react";

const AVAILABLE_PROMOS = [
  {
    id: 1,
    code: "SITA20",
    title: "20% OFF Your Next Ride",
    desc: "Valid for next 3 rides",
    discount: "20%",
    expiry: "Valid until Apr 15, 2026",
    terms: "Minimum fare of ₱30. Maximum discount ₱50.",
    color: "bg-gradient-to-br from-purple-500 to-purple-600",
  },
  {
    id: 2,
    code: "NEWUSER",
    title: "₱50 OFF First Ride",
    desc: "Para sa bagong SITA users",
    discount: "₱50",
    expiry: "Valid until Dec 31, 2026",
    terms: "One-time use only. For new users.",
    color: "bg-gradient-to-br from-green-500 to-green-600",
  },
  {
    id: 3,
    code: "WEEKEND",
    title: "Weekend Special",
    desc: "15% OFF Saturday & Sunday",
    discount: "15%",
    expiry: "Every weekend",
    terms: "Valid on weekends only. Up to ₱40 discount.",
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
  },
];

export function CustomerPromos() {
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [expandedPromo, setExpandedPromo] = useState<number | null>(null);

  const handleApplyCode = () => {
    const promo = AVAILABLE_PROMOS.find((p) => p.code.toUpperCase() === promoCode.toUpperCase());
    
    if (promo) {
      setAppliedPromo(promo.code);
      setError("");
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } else {
      setError("Invalid promo code");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleQuickApply = (code: string) => {
    setPromoCode(code);
    setAppliedPromo(code);
    setTimeout(() => {
      navigate(-1);
    }, 1500);
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#F47920] to-[#F47920]/90 pt-12 pb-6 px-5 relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-4 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="flex items-center justify-between mt-6">
          <div>
            <h1 className="text-white font-bold text-2xl mb-1">Promo Codes</h1>
            <p className="text-white/80 text-sm">Save more sa bawat ride!</p>
          </div>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Gift className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-5 pb-24">
        {/* Enter Code Section */}
        <div className="bg-white rounded-2xl shadow-sm p-4 -mt-4 mb-6">
          <p className="text-xs text-gray-500 font-semibold uppercase mb-3 flex items-center gap-2">
            <Tag className="w-3 h-3" />
            Enter Promo Code
          </p>
          
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="SITA20"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase());
                setError("");
              }}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-gray-800 uppercase font-semibold"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleApplyCode}
              disabled={!promoCode}
              className={`px-6 py-3 rounded-xl font-bold text-white ${
                promoCode ? "bg-[#F47920]" : "bg-gray-300"
              }`}
            >
              Apply
            </motion.button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-xs font-semibold flex items-center gap-1 mt-2"
            >
              <X className="w-3 h-3" />
              {error}
            </motion.p>
          )}

          {appliedPromo && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-green-600" />
              <p className="text-green-700 text-sm font-semibold">
                Promo code applied successfully!
              </p>
            </motion.div>
          )}
        </div>

        {/* Available Promos */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-800 mb-3 px-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#F47920]" />
            Available Promos
          </h2>

          <div className="space-y-3">
            {AVAILABLE_PROMOS.map((promo) => (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Promo Card */}
                <div className={`${promo.color} p-4 text-white relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16" />
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Gift className="w-4 h-4" />
                          <span className="text-xs font-semibold opacity-90">PROMO CODE</span>
                        </div>
                        <h3 className="text-xl font-black mb-1">{promo.title}</h3>
                        <p className="text-sm opacity-90">{promo.desc}</p>
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        <p className="text-sm font-black">{promo.discount}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                        <p className="text-xs font-bold">{promo.code}</p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleQuickApply(promo.code)}
                        className="bg-white text-gray-800 px-4 py-1.5 rounded-lg text-xs font-bold"
                      >
                        Use Code
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Expandable Details */}
                <button
                  onClick={() => setExpandedPromo(expandedPromo === promo.id ? null : promo.id)}
                  className="w-full px-4 py-3 bg-gray-50 text-xs text-gray-600 font-semibold hover:bg-gray-100 transition-colors"
                >
                  {expandedPromo === promo.id ? "Hide" : "View"} Terms & Conditions
                </button>

                {expandedPromo === promo.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-4 py-3 bg-gray-50 border-t border-gray-100"
                  >
                    <p className="text-xs text-gray-600 mb-2">
                      <span className="font-semibold">Expiry:</span> {promo.expiry}
                    </p>
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold">Terms:</span> {promo.terms}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Paano Gamitin
          </h3>
          <ol className="space-y-2 text-xs text-blue-800">
            <li className="flex gap-2">
              <span className="font-bold">1.</span>
              <span>I-copy ang promo code o i-click ang "Use Code"</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">2.</span>
              <span>I-paste sa booking checkout page</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold">3.</span>
              <span>Makikita mo agad ang discount sa fare</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
