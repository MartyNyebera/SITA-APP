import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, User, Phone, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { authApi, saveAuth } from "../../services/api";

export function CustomerSignup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authApi.customerRegister(formData);
      saveAuth(res.token, res.user, "user");
      navigate("/customer/otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#F47920] to-[#F47920]/90 pt-12 pb-8 px-5 relative">
        <button
          onClick={() => navigate("/")}
          className="absolute top-12 left-4 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center mt-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">👤</span>
          </div>
          <h1 className="text-white font-bold text-2xl mb-1">Sumali sa SITA</h1>
          <p className="text-white/80 text-sm">Create your passenger account</p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-auto px-5 pb-24">
        <form onSubmit={handleSubmit} className="py-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}
          {/* First Name */}
          <div>
            <label className="text-gray-700 text-sm font-semibold mb-2 block">
              Pangalan <span className="text-[#F47920]">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                placeholder="Juan"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-gray-800"
              />
            </div>
          </div>

          {/* Last Name */}
          <div>
            <label className="text-gray-700 text-sm font-semibold mb-2 block">
              Apelyido <span className="text-[#F47920]">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                placeholder="Dela Cruz"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-gray-800"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-gray-700 text-sm font-semibold mb-2 block">
              Mobile Number <span className="text-[#F47920]">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                required
                placeholder="+63 912 345 6789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-gray-800"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-gray-700 text-sm font-semibold mb-2 block">
              Email <span className="text-[#F47920]">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                placeholder="juan@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-gray-800"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-gray-700 text-sm font-semibold mb-2 block">
              Password <span className="text-[#F47920]">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-11 pr-12 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-gray-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              required
              id="terms"
              className="mt-1 w-4 h-4 text-[#F47920] border-gray-300 rounded focus:ring-[#F47920]"
            />
            <label htmlFor="terms" className="text-xs text-gray-600 leading-relaxed">
              Sumasang-ayon ako sa{" "}
              <span className="text-[#F47920] font-semibold">Terms of Service</span> at{" "}
              <span className="text-[#F47920] font-semibold">Privacy Policy</span> ng SITA
            </label>
          </div>

          {/* Submit Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-[#F47920] text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/20 mt-6 disabled:opacity-60"
          >
            {loading ? "Nagre-register..." : "Mag-Sign Up"}
          </motion.button>

          {/* Login Link */}
          <p className="text-center text-sm text-gray-600 mt-4">
            May account na?{" "}
            <button
              type="button"
              onClick={() => navigate("/customer/home")}
              className="text-[#F47920] font-semibold"
            >
              Mag-Log In
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}