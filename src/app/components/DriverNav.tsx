import { useNavigate, useLocation } from "react-router";
import { Home, TrendingUp, Clock, User } from "lucide-react";

const navItems = [
  { icon: Home, label: "Dashboard", path: "/driver/home" },
  { icon: TrendingUp, label: "Earnings", path: "/driver/earnings" },
  { icon: Clock, label: "History", path: "/driver/earnings" },
  { icon: User, label: "Profile", path: "/driver/profile" },
];

export function DriverNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a2e] border-t border-white/10 flex items-center justify-around px-2 pb-4 pt-2 z-20">
      {navItems.map(({ icon: Icon, label, path }) => {
        const active = location.pathname === path;
        return (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-0.5 flex-1 py-1"
          >
            <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${active ? "bg-[#F47920]/20" : ""}`}>
              <Icon className={`w-5 h-5 ${active ? "text-[#F47920]" : "text-gray-500"}`} />
            </div>
            <span className={`text-[10px] font-medium ${active ? "text-[#F47920]" : "text-gray-500"}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
