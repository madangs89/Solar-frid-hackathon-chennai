import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { label: "Dashboard", path: "/dashboard", icon: "◈" },
  { label: "Alerts", path: "/alerts", icon: "◬" },
  { label: "Logs", path: "/logs", icon: "≡" },
];

const C = {
  green: "#22d97a",
  border: "rgba(255,255,255,0.07)",
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  return (
    <div
      className="w-full flex items-center justify-between px-6 py-0"
      style={{
        background: "rgba(6,13,10,0.92)",
        borderBottom: `1px solid ${C.border}`,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        fontFamily: "'DM Mono', 'Fira Code', monospace",
        height: 52,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* ── LEFT: logo + links ── */}
      <div className="flex items-center gap-6">
        {/* logo */}
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 group"
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-black"
            style={{
              background: `linear-gradient(135deg, ${C.green}30, ${C.green}10)`,
              border: `1px solid ${C.green}40`,
              color: C.green,
              boxShadow: `0 0 12px ${C.green}20`,
            }}
          >
            ⚡
          </div>
          <span
            className="text-sm font-black tracking-tight text-white"
            style={{ letterSpacing: "-0.02em" }}
          >
            Ener<span style={{ color: C.green }}>Vue</span>
          </span>
        </button>

        {/* divider */}
        <div className="w-px h-5" style={{ background: C.border }} />

        {/* nav links */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ label, path, icon }) => {
            const active =
              location.pathname === path ||
              location.pathname.startsWith(path + "/");
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150"
                style={{
                  color: active ? C.green : "rgba(255,255,255,0.45)",
                  background: active ? `${C.green}12` : "transparent",
                  border: `1px solid ${active ? C.green + "30" : "transparent"}`,
                  fontWeight: active ? 700 : 400,
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "rgba(255,255,255,0.45)";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <span className="text-[10px] opacity-70">{icon}</span>
                <span className="uppercase tracking-widest text-[10px]">
                  {label}
                </span>
                {/* active underline */}
                {active && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-px rounded-full"
                    style={{
                      background: C.green,
                      boxShadow: `0 0 6px ${C.green}`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── RIGHT: time + live + avatar ── */}
      <div className="flex items-center gap-4">
        {/* clock */}
        <span
          className="text-[11px] tabular-nums"
          style={{ color: "rgba(255,255,255,0.25)", letterSpacing: "0.05em" }}
        >
          {fmt}
        </span>

        {/* divider */}
        <div className="w-px h-4" style={{ background: C.border }} />

        {/* live badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          style={{
            background: `${C.green}12`,
            border: `1px solid ${C.green}30`,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: C.green, boxShadow: `0 0 6px ${C.green}` }}
          />
          <span
            className="text-[9px] font-black uppercase tracking-widest"
            style={{ color: C.green }}
          >
            Live
          </span>
        </div>

        {/* avatar */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black cursor-pointer transition hover:scale-110"
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))`,
            border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.7)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        >
          D
        </div>
      </div>
    </div>
  );
}
