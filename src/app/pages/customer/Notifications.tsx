import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Bell, Check, X, Gift, AlertCircle, TrendingUp, Star } from "lucide-react";
import { useState } from "react";

const NOTIFICATIONS = [
  {
    id: 1,
    type: "ride",
    icon: "🛺",
    title: "Ride Completed!",
    message: "Your ride to Municipal Hall is complete. ₱35.00 charged.",
    time: "5 min ago",
    read: false,
    color: "bg-green-50",
  },
  {
    id: 2,
    type: "promo",
    icon: "🎉",
    title: "New Promo Available!",
    message: "Get 20% OFF on your next 3 rides. Use code: SITA20",
    time: "1 hour ago",
    read: false,
    color: "bg-purple-50",
  },
  {
    id: 3,
    type: "payment",
    icon: "💳",
    title: "Payment Successful",
    message: "₱200 has been added to your SITA Wallet.",
    time: "3 hours ago",
    read: true,
    color: "bg-blue-50",
  },
  {
    id: 4,
    type: "rating",
    icon: "⭐",
    title: "Rate Your Last Ride",
    message: "How was your experience with Rolando? Help us improve!",
    time: "Yesterday",
    read: true,
    color: "bg-yellow-50",
  },
  {
    id: 5,
    type: "alert",
    icon: "⚠️",
    title: "Service Advisory",
    message: "Heavy traffic sa EDSA area. Plan ahead!",
    time: "Yesterday",
    read: true,
    color: "bg-red-50",
  },
];

export function CustomerNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter((n) => n.id !== id));
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
            <h1 className="text-white font-bold text-2xl">Notifications</h1>
            <p className="text-white/80 text-sm">
              {unreadCount > 0 ? `${unreadCount} new notifications` : "All caught up!"}
            </p>
          </div>
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <Bell className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Mark All Read Button */}
      {unreadCount > 0 && (
        <div className="px-5 py-3 bg-white border-b border-gray-100">
          <button
            onClick={markAllRead}
            className="text-[#F47920] text-sm font-semibold flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Mark all as read
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="flex-1 overflow-auto px-5 py-4 space-y-2">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-semibold">No notifications</p>
            <p className="text-gray-400 text-sm">We'll notify you when something new arrives</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`relative bg-white rounded-2xl p-4 shadow-sm ${
                !notif.read ? "ring-2 ring-[#F47920]/20" : ""
              }`}
            >
              {!notif.read && (
                <div className="absolute top-4 right-4 w-2 h-2 bg-[#F47920] rounded-full" />
              )}

              <div className="flex gap-3">
                <div className={`w-12 h-12 ${notif.color} rounded-full flex items-center justify-center flex-shrink-0 text-2xl`}>
                  {notif.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-800 mb-1">{notif.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">{notif.message}</p>
                  <p className="text-[10px] text-gray-400">{notif.time}</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-3">
                {!notif.read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    className="flex-1 py-2 rounded-lg bg-[#F47920]/10 text-[#F47920] text-xs font-semibold"
                  >
                    Mark as read
                  </button>
                )}
                <button
                  onClick={() => deleteNotification(notif.id)}
                  className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Remove
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
