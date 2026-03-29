import { useEffect, useState } from "react";

interface MapMarker {
  x: number;
  y: number;
  type: "pickup" | "dropoff" | "driver" | "driver2" | "driver3";
}

interface MapViewProps {
  markers?: MapMarker[];
  showDriverMoving?: boolean;
  className?: string;
  label?: string;
}

const CITY_BLOCKS = [
  { x1: 0, y1: 20, x2: 100, y2: 20 },
  { x1: 0, y1: 38, x2: 100, y2: 38 },
  { x1: 0, y1: 56, x2: 100, y2: 56 },
  { x1: 0, y1: 74, x2: 100, y2: 74 },
  { x1: 0, y1: 88, x2: 100, y2: 88 },
  { x1: 15, y1: 0, x2: 15, y2: 100 },
  { x1: 32, y1: 0, x2: 32, y2: 100 },
  { x1: 50, y1: 0, x2: 50, y2: 100 },
  { x1: 68, y1: 0, x2: 68, y2: 100 },
  { x1: 85, y1: 0, x2: 85, y2: 100 },
];

const BUILDINGS = [
  { x: 2, y: 2, w: 10, h: 15, color: "#e2e8f0" },
  { x: 18, y: 2, w: 11, h: 14, color: "#dde6f0" },
  { x: 34, y: 2, w: 13, h: 12, color: "#e8eef5" },
  { x: 52, y: 2, w: 13, h: 15, color: "#dce5f0" },
  { x: 70, y: 2, w: 12, h: 14, color: "#e4ecf5" },
  { x: 87, y: 2, w: 11, h: 15, color: "#dfe8f2" },
  { x: 2, y: 22, w: 10, h: 12, color: "#e6ecf4" },
  { x: 18, y: 22, w: 11, h: 13, color: "#dde6ef" },
  { x: 34, y: 22, w: 13, h: 11, color: "#e2e9f3" },
  { x: 52, y: 22, w: 13, h: 12, color: "#d8e4ef" },
  { x: 70, y: 22, w: 12, h: 13, color: "#e0eaf3" },
  { x: 87, y: 22, w: 11, h: 12, color: "#dde6ef" },
  { x: 2, y: 40, w: 10, h: 13, color: "#e4ecf5" },
  { x: 18, y: 40, w: 11, h: 14, color: "#dbe4ee" },
  { x: 34, y: 40, w: 13, h: 13, color: "#e6ecf4" },
  { x: 52, y: 40, w: 13, h: 14, color: "#dde6f0" },
  { x: 70, y: 40, w: 12, h: 13, color: "#e2e8f2" },
  { x: 87, y: 40, w: 11, h: 14, color: "#d9e3ed" },
  { x: 2, y: 58, w: 10, h: 13, color: "#e0eaf3" },
  { x: 18, y: 58, w: 11, h: 12, color: "#dce5ef" },
  { x: 34, y: 58, w: 13, h: 11, color: "#e4ecf5" },
  { x: 52, y: 58, w: 13, h: 12, color: "#dbe3ee" },
  { x: 70, y: 58, w: 12, h: 13, color: "#e2eaf3" },
  { x: 87, y: 58, w: 11, h: 11, color: "#dde6f0" },
  { x: 2, y: 76, w: 10, h: 10, color: "#e6ecf5" },
  { x: 18, y: 76, w: 11, h: 10, color: "#dce5f0" },
  { x: 34, y: 76, w: 13, h: 10, color: "#e0eaf3" },
  { x: 52, y: 76, w: 13, h: 10, color: "#d9e3ee" },
  { x: 70, y: 76, w: 12, h: 10, color: "#e4ecf5" },
  { x: 87, y: 76, w: 11, h: 10, color: "#dbe4ef" },
  { x: 2, y: 90, w: 10, h: 9, color: "#e2e8f2" },
  { x: 18, y: 90, w: 11, h: 9, color: "#dce5ef" },
  { x: 34, y: 90, w: 13, h: 9, color: "#e6ecf4" },
  { x: 52, y: 90, w: 13, h: 9, color: "#dde6f0" },
  { x: 70, y: 90, w: 12, h: 9, color: "#e0eaf3" },
  { x: 87, y: 90, w: 11, h: 9, color: "#d9e4ef" },
];

export function MapView({ markers = [], showDriverMoving = false, className = "", label = "Poblacion Area" }: MapViewProps) {
  const [driverPos, setDriverPos] = useState({ x: 60, y: 65 });

  useEffect(() => {
    if (!showDriverMoving) return;
    const interval = setInterval(() => {
      setDriverPos((prev) => ({
        x: Math.max(20, Math.min(80, prev.x + (Math.random() - 0.5) * 3)),
        y: Math.max(20, Math.min(70, prev.y + (Math.random() - 0.6) * 2)),
      }));
    }, 1200);
    return () => clearInterval(interval);
  }, [showDriverMoving]);

  return (
    <div className={`relative w-full h-full overflow-hidden bg-[#f0f4f8] ${className}`}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
        {/* Background */}
        <rect width="100" height="100" fill="#eef2f7" />
        {/* Parks */}
        <rect x="18" y="40" width="11" height="14" rx="1" fill="#c8e6c9" opacity="0.7" />
        <rect x="52" y="22" width="13" height="12" rx="1" fill="#d4edda" opacity="0.6" />
        {/* Buildings */}
        {BUILDINGS.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="0.5" fill={b.color} stroke="#d1dce8" strokeWidth="0.3" />
            <rect x={b.x + 1.5} y={b.y + 2} width={1.5} height={1.5} rx="0.2" fill="#b0c4de" opacity="0.8" />
            <rect x={b.x + 4} y={b.y + 2} width={1.5} height={1.5} rx="0.2" fill="#b0c4de" opacity="0.8" />
            <rect x={b.x + 6.5} y={b.y + 2} width={1.5} height={1.5} rx="0.2" fill="#b0c4de" opacity="0.8" />
            <rect x={b.x + 1.5} y={b.y + 5} width={1.5} height={1.5} rx="0.2" fill="#b0c4de" opacity="0.5" />
            <rect x={b.x + 4} y={b.y + 5} width={1.5} height={1.5} rx="0.2" fill="#b0c4de" opacity="0.5" />
          </g>
        ))}
        {/* Roads */}
        {CITY_BLOCKS.map((r, i) => (
          <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke="#ffffff" strokeWidth={i < 5 ? "3.5" : "3"} strokeLinecap="round" />
        ))}
        {/* Road dashes */}
        {CITY_BLOCKS.map((r, i) => (
          <line key={`c-${i}`} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke="#e2c45a" strokeWidth="0.3" strokeDasharray="2,2" opacity="0.5" />
        ))}
        {/* Route path */}
        {markers.length >= 2 && (
          <path
            d={`M ${markers[0].x} ${markers[0].y} C ${markers[0].x + 15} ${markers[0].y - 10}, ${markers[markers.length - 1].x - 15} ${markers[markers.length - 1].y + 10}, ${markers[markers.length - 1].x} ${markers[markers.length - 1].y}`}
            fill="none"
            stroke="#F47920"
            strokeWidth="1.5"
            strokeDasharray="3,2"
            opacity="0.8"
          />
        )}
        {/* Moving dots */}
        {showDriverMoving && (
          <>
            <circle cx={driverPos.x - 10} cy={driverPos.y + 5} r="1.5" fill="#F47920" opacity="0.5" />
            <circle cx={driverPos.x + 8} cy={driverPos.y - 8} r="1.5" fill="#F47920" opacity="0.5" />
          </>
        )}
        {/* Markers */}
        {markers.map((m, i) => (
          <g key={i}>
            {m.type === "pickup" && (
              <>
                <circle cx={m.x} cy={m.y} r="3.5" fill="#22c55e" opacity="0.25" />
                <circle cx={m.x} cy={m.y} r="2" fill="#22c55e" />
                <circle cx={m.x} cy={m.y} r="0.8" fill="white" />
              </>
            )}
            {m.type === "dropoff" && (
              <>
                <circle cx={m.x} cy={m.y} r="3.5" fill="#F47920" opacity="0.25" />
                <circle cx={m.x} cy={m.y} r="2.2" fill="#F47920" />
                <rect x={m.x - 0.8} y={m.y - 2} width={1.6} height={3} rx="0.3" fill="white" />
                <circle cx={m.x} cy={m.y - 2.5} r="0.8" fill="white" />
              </>
            )}
            {(m.type === "driver" || m.type === "driver2" || m.type === "driver3") && (
              <>
                <circle cx={m.x} cy={m.y} r="4" fill="#F47920" opacity="0.2" />
                <circle cx={m.x} cy={m.y} r="2.5" fill="#F47920" />
                <text x={m.x} y={m.y + 0.8} textAnchor="middle" fontSize="2.5" fill="white">🛺</text>
              </>
            )}
          </g>
        ))}
      </svg>
      {/* Map label */}
      <div className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm rounded-lg px-2 py-1">
        <span className="text-[10px] text-gray-500 font-medium">📍 {label}</span>
      </div>
    </div>
  );
}
