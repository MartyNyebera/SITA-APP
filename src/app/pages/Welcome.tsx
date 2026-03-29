import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Shield, Clock, Star } from "lucide-react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1728021535696-d61d997044d8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmljeWNsZSUyMHNpZGVjYXIlMjBwaGlsaXBwaW5lcyUyMHN0cmVldHxlbnwxfHx8fDE3NzQ1NzExNTd8MA&ixlib=rb-4.1.0&q=80&w=1080";

const features = [
  { icon: Shield, text: "Safe & Registered" },
  { icon: Clock, text: "Fast Pickup" },
  { icon: Star, text: "Rated Drivers" },
];

export function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="relative h-full w-full flex flex-col overflow-hidden bg-[#1a1a2e]">
      {/* Hero Image */}
      <div className="relative flex-1 overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="Tricycle"
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e]/60 via-[#1a1a2e]/20 to-[#1a1a2e]" />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute top-12 left-0 right-0 flex flex-col items-center"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-12 h-12 bg-[#F47920] rounded-2xl flex items-center justify-center shadow-lg shadow-orange-900/40">
              <span className="text-2xl">🛺</span>
            </div>
            <span className="text-white text-4xl font-black tracking-tight">
              SITA
            </span>
          </div>
          <span className="text-[#F47920] text-xs font-semibold tracking-widest uppercase">
            Serbisyo · Integridad · Tiwala · Angkas
          </span>
        </motion.div>
      </div>

      {/* Bottom Sheet */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="bg-[#1a1a2e] px-6 pt-6 pb-10 rounded-t-3xl -mt-8 relative z-10"
      >
        <h2 className="text-white text-xl font-bold mb-1">
          Your Tricycle, <span className="text-[#F47920]">On Demand.</span>
        </h2>
        <p className="text-gray-400 text-sm mb-5">
          Book a tricycle in seconds. Locally trusted, community-powered.
        </p>

        {/* Features */}
        <div className="flex gap-4 mb-6">
          {features.map(({ icon: Icon, text }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div className="w-9 h-9 rounded-full bg-[#F47920]/20 flex items-center justify-center">
                <Icon className="w-4 h-4 text-[#F47920]" />
              </div>
              <span className="text-gray-300 text-[10px] text-center leading-tight">
                {text}
              </span>
            </motion.div>
          ))}
        </div>

        {/* POV Selection */}
        <p className="text-gray-400 text-xs text-center mb-3 uppercase tracking-wider font-semibold">
          I am a...
        </p>

        <div className="flex gap-3 mb-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/customer/signup")}
            className="flex-1 bg-[#F47920] text-white py-4 rounded-2xl font-bold text-sm shadow-lg shadow-orange-900/30 flex flex-col items-center gap-1"
          >
            <span className="text-2xl">👤</span>
            Passenger
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/driver/signup")}
            className="flex-1 bg-white/10 text-white py-4 rounded-2xl font-bold text-sm border border-white/20 flex flex-col items-center gap-1"
          >
            <span className="text-2xl">🛺</span>
            Driver
          </motion.button>
        </div>

        <p className="text-center text-gray-500 text-xs">
          By continuing, you agree to SITA's Terms & Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}