import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Mail, Check } from "lucide-react";
import { getStoredUser } from "../../services/api";

export function CustomerOTPVerification() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    setTimer(60);
    setCanResend(false);
    // TODO: Trigger resend OTP API
  };

  const user = getStoredUser<{ email?: string; first_name?: string }>();

  const handleVerify = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) return;

    setIsVerifying(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsVerified(true);
    setIsVerifying(false);

    setTimeout(() => {
      navigate("/customer/home");
    }, 1200);
  };

  return (
    <div className="h-full w-full flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#F47920] to-[#F47920]/90 pt-12 pb-8 px-5 relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-12 left-4 w-9 h-9 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div className="text-center mt-6">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-3">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-white font-bold text-2xl mb-1">I-verify ang Email</h1>
          <p className="text-white/80 text-sm">
            Nag-send kami ng code sa
            <br />
            <span className="font-semibold">{user?.email || "iyong email"}</span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center px-5 pt-8">
        {isVerified ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Verified!</h2>
            <p className="text-gray-600 text-sm">Redirecting ka na...</p>
          </motion.div>
        ) : (
          <>
            <p className="text-gray-700 font-semibold mb-6">Enter 6-digit code</p>

            {/* OTP Input */}
            <div className="flex gap-2 mb-8">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:outline-none focus:border-[#F47920] focus:ring-2 focus:ring-[#F47920]/20 text-gray-800"
                />
              ))}
            </div>

            {/* Timer & Resend */}
            <div className="text-center mb-8">
              {canResend ? (
                <button
                  onClick={handleResend}
                  className="text-[#F47920] font-semibold text-sm"
                >
                  I-resend ang code
                </button>
              ) : (
                <p className="text-gray-500 text-sm">
                  Resend code in <span className="font-semibold text-[#F47920]">{timer}s</span>
                </p>
              )}
            </div>

            {/* Verify Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleVerify}
              disabled={otp.join("").length !== 6 || isVerifying}
              className={`w-full py-4 rounded-xl font-bold text-white shadow-lg ${
                otp.join("").length === 6 && !isVerifying
                  ? "bg-[#F47920] shadow-orange-900/20"
                  : "bg-gray-300"
              }`}
            >
              {isVerifying ? "Verifying..." : "I-verify"}
            </motion.button>

            <button
              onClick={() => navigate("/customer/home")}
              className="text-gray-500 text-sm mt-6"
            >
              Skip for now
            </button>
          </>
        )}
      </div>
    </div>
  );
}
