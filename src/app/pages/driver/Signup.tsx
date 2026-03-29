import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, User, Phone, Mail, Lock, Eye, EyeOff, Upload, FileText, CheckCircle } from "lucide-react";
import { authApi, saveAuth } from "../../services/api";

export function DriverSignup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    plateNumber: "",
    vehicleModel: "",
    vehicleColor: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLicenseFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let licenseUrl: string | undefined;
      if (licenseFile) {
        const fd = new FormData();
        fd.append("file", licenseFile);
        const uploadRes = await fetch("http://localhost:3010/api/auth/upload", {
          method: "POST",
          body: fd,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json() as { url?: string };
          licenseUrl = uploadData.url;
        }
      }
      const res = await authApi.driverRegister({ ...formData, licenseUrl });
      saveAuth(res.token, res.driver, "driver");
      navigate("/driver/otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a2e] to-[#2d2d4e] pt-12 pb-8 px-5 relative">
        <button
          onClick={() => navigate("/")}
          className="absolute top-12 left-4 w-9 h-9 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center mt-6">
          <div className="w-16 h-16 bg-[#F47920]/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-3xl">🛺</span>
          </div>
          <h1 className="text-white font-bold text-2xl mb-1">Maging Driver</h1>
          <p className="text-gray-400 text-sm">Register as a SITA tricycle driver</p>
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
          {/* Personal Info Section */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-gray-800 font-bold text-sm mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-[#F47920]" />
              Personal na Impormasyon
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-gray-700 text-xs font-semibold mb-1.5 block">
                  Pangalan <span className="text-[#F47920]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rolando"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="text-gray-700 text-xs font-semibold mb-1.5 block">
                  Apelyido <span className="text-[#F47920]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Dela Cruz"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="text-gray-700 text-xs font-semibold mb-1.5 block">
                  Mobile Number <span className="text-[#F47920]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+63 912 345 6789"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="text-gray-700 text-xs font-semibold mb-1.5 block">
                  Email <span className="text-[#F47920]">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="rolando@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="text-gray-700 text-xs font-semibold mb-1.5 block">
                  Password <span className="text-[#F47920]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2.5 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-sm text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Info Section */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-gray-800 font-bold text-sm mb-4 flex items-center gap-2">
              <span className="text-lg">🛺</span>
              Tricycle Details
            </h2>

            <div className="space-y-3">
              <div>
                <label className="text-gray-700 text-xs font-semibold mb-1.5 block">
                  Plate Number <span className="text-[#F47920]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ABC-1234"
                  value={formData.plateNumber}
                  onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="text-gray-700 text-xs font-semibold mb-1.5 block">
                  Vehicle Model <span className="text-[#F47920]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Honda TMX"
                  value={formData.vehicleModel}
                  onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="text-gray-700 text-xs font-semibold mb-1.5 block">
                  Kulay ng Sasakyan <span className="text-[#F47920]">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Puti"
                  value={formData.vehicleColor}
                  onChange={(e) => setFormData({ ...formData, vehicleColor: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F47920]/20 focus:border-[#F47920] text-sm text-gray-800"
                />
              </div>
            </div>
          </div>

          {/* Driver's License Upload */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="text-gray-800 font-bold text-sm mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#F47920]" />
              Driver's License
            </h2>
            <p className="text-xs text-gray-500 mb-3">I-upload ang kopya ng iyong lisensya</p>

            <label className="block">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
                required
              />
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-[#F47920] transition-colors">
                {licenseFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                    <p className="text-sm font-semibold text-gray-800">{licenseFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(licenseFile.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setLicenseFile(null);
                      }}
                      className="text-xs text-[#F47920] font-semibold mt-1"
                    >
                      Palitan
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-[#F47920]/10 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-[#F47920]" />
                    </div>
                    <p className="text-sm font-semibold text-gray-800">
                      Click to upload license
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, or PDF (max 5MB)</p>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              required
              id="driver-terms"
              className="mt-1 w-4 h-4 text-[#F47920] border-gray-300 rounded focus:ring-[#F47920]"
            />
            <label htmlFor="driver-terms" className="text-xs text-gray-600 leading-relaxed">
              Sumasang-ayon ako sa{" "}
              <span className="text-[#F47920] font-semibold">Driver Terms</span>,{" "}
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
            {loading ? "Nagsusumite..." : "Mag-Submit ng Application"}
          </motion.button>

          {/* Login Link */}
          <p className="text-center text-sm text-gray-600 mt-4">
            May account na?{" "}
            <button
              type="button"
              onClick={() => navigate("/driver/home")}
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