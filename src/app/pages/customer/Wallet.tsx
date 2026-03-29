import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Wallet, CreditCard, Banknote, Plus, ChevronRight, Eye, EyeOff, TrendingUp, History } from "lucide-react";

const PAYMENT_METHODS = [
  { id: "cash", icon: Banknote, name: "Cash", desc: "Pay driver directly", color: "bg-green-50 text-green-600" },
  { id: "wallet", icon: Wallet, name: "SITA Wallet", desc: "Balance: ₱250.00", color: "bg-orange-50 text-[#F47920]" },
  { id: "card", icon: CreditCard, name: "Credit/Debit Card", desc: "Visa •••• 4567", color: "bg-blue-50 text-blue-600" },
];

const RECENT_TRANSACTIONS = [
  { id: 1, type: "ride", desc: "Ride from SM Mall", amount: -45, date: "Mar 28, 2026" },
  { id: 2, type: "topup", desc: "Top-up via GCash", amount: 200, date: "Mar 27, 2026" },
  { id: 3, type: "ride", desc: "Ride from Home", amount: -35, date: "Mar 26, 2026" },
  { id: 4, type: "refund", desc: "Ride refund", amount: 50, date: "Mar 25, 2026" },
];

export function CustomerWallet() {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState("cash");
  const [showBalance, setShowBalance] = useState(true);
  const walletBalance = 250.0;

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
        <div className="mt-6">
          <p className="text-white/80 text-sm mb-1">SITA Wallet</p>
          <div className="flex items-center gap-3">
            <h1 className="text-white font-bold text-3xl">
              {showBalance ? `₱${walletBalance.toFixed(2)}` : "₱•••••"}
            </h1>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center"
            >
              {showBalance ? <EyeOff className="w-4 h-4 text-white" /> : <Eye className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 -mt-4 mb-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 flex gap-3">
          <button className="flex-1 flex flex-col items-center gap-2 py-2">
            <div className="w-12 h-12 bg-[#F47920]/10 rounded-full flex items-center justify-center">
              <Plus className="w-5 h-5 text-[#F47920]" />
            </div>
            <span className="text-xs font-semibold text-gray-700">Top Up</span>
          </button>
          <button className="flex-1 flex flex-col items-center gap-2 py-2">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-gray-700">Send</span>
          </button>
          <button className="flex-1 flex flex-col items-center gap-2 py-2">
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
              <History className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs font-semibold text-gray-700">History</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-5 pb-24">
        {/* Payment Methods */}
        <div className="mb-6">
          <h2 className="text-gray-800 font-bold text-sm mb-3 px-1">Payment Methods</h2>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              return (
                <motion.button
                  key={method.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full bg-white rounded-2xl p-4 flex items-center gap-3 transition-all ${
                    isSelected ? "ring-2 ring-[#F47920] shadow-md" : "shadow-sm"
                  }`}
                >
                  <div className={`w-12 h-12 ${method.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-gray-800">{method.name}</p>
                    <p className="text-xs text-gray-500">{method.desc}</p>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 bg-[#F47920] rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </motion.button>
              );
            })}

            {/* Add Payment Method */}
            <button className="w-full bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl p-4 flex items-center justify-center gap-2 text-gray-600 hover:border-[#F47920] hover:text-[#F47920] transition-colors">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-semibold">Add Payment Method</span>
            </button>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <h2 className="text-gray-800 font-bold text-sm mb-3 px-1">Recent Transactions</h2>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {RECENT_TRANSACTIONS.map((transaction, i) => (
              <button
                key={transaction.id}
                className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 ${
                  i < RECENT_TRANSACTIONS.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.amount > 0 ? "bg-green-50" : "bg-gray-100"
                  }`}
                >
                  <span className="text-lg">
                    {transaction.type === "ride" ? "🛺" : transaction.type === "topup" ? "💰" : "↩️"}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-gray-800">{transaction.desc}</p>
                  <p className="text-xs text-gray-500">{transaction.date}</p>
                </div>
                <p
                  className={`text-sm font-bold ${
                    transaction.amount > 0 ? "text-green-600" : "text-gray-800"
                  }`}
                >
                  {transaction.amount > 0 ? "+" : ""}₱{Math.abs(transaction.amount)}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="absolute bottom-20 left-0 right-0 px-5 pb-4 bg-gradient-to-t from-gray-50 via-gray-50 to-transparent pt-6">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate(-1)}
          className="w-full bg-[#F47920] text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/20"
        >
          Set as Default Payment
        </motion.button>
      </div>
    </div>
  );
}
