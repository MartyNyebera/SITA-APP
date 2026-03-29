import { Outlet, useLocation } from "react-router";

export function Root() {
  const location = useLocation();

  const isDriver = location.pathname.startsWith("/driver");
  const isCustomer = location.pathname.startsWith("/customer");

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: isDriver ? "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f0f1a 100%)" : "linear-gradient(135deg, #1a1a2e 0%, #2d2d4e 50%, #1a1a2e 100%)" }}
    >
      {/* POV badge */}
      {(isDriver || isCustomer) && (
        <div className="mb-3 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5">
          <span className="text-sm">{isDriver ? "🛺" : "👤"}</span>
          <span className="text-white text-xs font-semibold">
            {isDriver ? "Driver POV — SITA" : "Passenger POV — SITA"}
          </span>
          <div className={`w-2 h-2 rounded-full animate-pulse ${isDriver ? "bg-[#F47920]" : "bg-green-400"}`} />
        </div>
      )}

      {/* Phone frame */}
      <div
        className="relative bg-white overflow-hidden shadow-2xl w-full"
        style={{
          maxWidth: "390px",
          height: "min(844px, calc(100vh - 80px))",
          borderRadius: "clamp(0px, 3vw, 40px)",
          boxShadow: isDriver
            ? "0 25px 80px rgba(244,121,32,0.3), 0 0 0 1px rgba(255,255,255,0.1)"
            : "0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)",
        }}
      >
        <Outlet />
      </div>

      {/* Branding */}
      <div className="mt-3 flex items-center gap-1.5">
        <span className="text-gray-500 text-xs">Powered by</span>
        <span className="text-[#F47920] text-xs font-bold">SITA</span>
        <span className="text-gray-600 text-xs">· Tricycle Ride-Hailing</span>
      </div>
    </div>
  );
}
