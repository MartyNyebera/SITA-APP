import { motion } from "motion/react";
import { AlertTriangle, Phone, Shield, MapPin } from "lucide-react";
import { useState } from "react";

interface SOSModalProps {
  onClose: () => void;
}

export function SOSModal({ onClose }: SOSModalProps) {
  const [isEmergencyCalled, setIsEmergencyCalled] = useState(false);

  const handleEmergencyCall = () => {
    setIsEmergencyCalled(true);
    // TODO: Trigger emergency API call
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
      >
        {isEmergencyCalled ? (
          <div className="text-center py-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Shield className="w-8 h-8 text-green-600" />
            </motion.div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Emergency Sent!</h3>
            <p className="text-sm text-gray-600">
              SITA support at emergency services ay nanotify na.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
              Emergency SOS
            </h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              Mag-activate ng emergency alert. Ang iyong location at ride details ay ishashare sa:
            </p>

            {/* Emergency contacts */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded-xl">
                <Phone className="w-5 h-5 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">Emergency Hotline</p>
                  <p className="text-xs text-gray-600">911 / SITA Support</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <Shield className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">SITA Safety Team</p>
                  <p className="text-xs text-gray-600">24/7 monitoring</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                <MapPin className="w-5 h-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">Emergency Contacts</p>
                  <p className="text-xs text-gray-600">Your saved contacts</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleEmergencyCall}
                className="w-full bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/30 flex items-center justify-center gap-2"
              >
                <AlertTriangle className="w-5 h-5" />
                Activate Emergency SOS
              </motion.button>

              <button
                onClick={onClose}
                className="w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl"
              >
                Cancel
              </button>
            </div>

            <p className="text-[10px] text-gray-400 text-center mt-4">
              Abuse ng emergency system ay may kaparusahan under SITA Terms
            </p>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
