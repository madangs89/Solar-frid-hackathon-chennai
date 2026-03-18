import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setArray, setArrayForPerticularData } from "../redux/Slice/authSlice";

/* ─── STATUS CONFIG ─────────────────────────────────────────── */
const STATUS = {
  healthy: {
    glow: "#22d97a",
    bg: "rgba(34,217,122,0.07)",
    border: "rgba(34,217,122,0.35)",
    label: "Optimal",
    icon: "●",
    cellLine: "rgba(34,217,122,0.25)",
  },
  warning: {
    glow: "#f5a623",
    bg: "rgba(245,166,35,0.07)",
    border: "rgba(245,166,35,0.35)",
    label: "Degraded",
    icon: "▲",
    cellLine: "rgba(245,166,35,0.25)",
  },
  cleaning: {
    glow: "#f04b4b",
    bg: "rgba(240,75,75,0.07)",
    border: "rgba(240,75,75,0.35)",
    label: "Dirty",
    icon: "◆",
    cellLine: "rgba(240,75,75,0.2)",
  },
};

/* ─── HELPER: compute avg power + efficiency from history ────── */
function avgFromHistory(history) {
  if (!history || history.length === 0)
    return { power: 0, efficiency: 0, irradiance: 0 };
  const len = history.length;
  const power = history.reduce((s, r) => s + Number(r.power || 0), 0) / len;
  const efficiency =
    history.reduce((s, r) => s + Number(r.efficiency || 0), 0) / len;
  const irradiance =
    history.reduce((s, r) => s + Number(r.irradiance || 0), 0) / len;
  return { power, efficiency, irradiance };
}

function getStatus(efficiency, irradiance) {
  const needsCleaning = efficiency < 0.6 && irradiance > 500;
  if (needsCleaning) return "cleaning";
  if (efficiency < 0.75) return "warning";
  return "healthy";
}

/* ─── SOLAR CELL SVG ─────────────────────────────────────────── */
function SolarCellGrid({ status }) {
  const s = STATUS[status];
  return (
    <svg
      viewBox="0 0 80 52"
      className="w-full h-full"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient
          id={`cellGrad-${status}`}
          x1="0%"
          y1="0%"
          x2="100%"
          y2="100%"
        >
          <stop offset="0%" stopColor={s.glow} stopOpacity="0.18" />
          <stop offset="100%" stopColor={s.glow} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <rect
        x="1"
        y="1"
        width="78"
        height="50"
        rx="3"
        fill={`url(#cellGrad-${status})`}
        stroke={s.cellLine}
        strokeWidth="0.8"
      />
      {[18, 35, 52].map((y) => (
        <line
          key={y}
          x1="1"
          y1={y}
          x2="79"
          y2={y}
          stroke={s.cellLine}
          strokeWidth="0.6"
        />
      ))}
      {[20, 40, 60].map((x) => (
        <line
          key={x}
          x1={x}
          y1="1"
          x2={x}
          y2="51"
          stroke={s.cellLine}
          strokeWidth="0.6"
        />
      ))}
      <line
        x1="1"
        y1="1"
        x2="79"
        y2="51"
        stroke={s.glow}
        strokeWidth="0.4"
        strokeOpacity="0.15"
      />
      <line
        x1="79"
        y1="1"
        x2="1"
        y2="51"
        stroke={s.glow}
        strokeWidth="0.4"
        strokeOpacity="0.10"
      />
      <circle cx="40" cy="26" r="14" fill={s.glow} fillOpacity="0.06" />
    </svg>
  );
}

/* ─── MAP PIN SVG ────────────────────────────────────────────── */
function MapPin({ color }) {
  return (
    <svg width="10" height="13" viewBox="0 0 10 13" fill="none">
      <path
        d="M5 0C2.24 0 0 2.24 0 5c0 3.75 5 8 5 8s5-4.25 5-8c0-2.76-2.24-5-5-5z"
        fill={color}
        fillOpacity="0.9"
      />
      <circle cx="5" cy="5" r="1.8" fill="#080c10" fillOpacity="0.7" />
    </svg>
  );
}

/* ─── MAP TILE ───────────────────────────────────────────────── */
function MapTile({ lat, lng, glow }) {
  if (!lat || !lng) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "rgba(255,255,255,0.02)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.5"
        >
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
        <span
          style={{
            fontSize: 7,
            color: "rgba(255,255,255,0.15)",
            letterSpacing: "0.1em",
          }}
        >
          NO LOCATION
        </span>
      </div>
    );
  }
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <iframe
        src={`https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed&maptype=satellite`}
        width="100%"
        height="100%"
        style={{
          border: "none",
          display: "block",
          filter: "saturate(0.55) brightness(0.7) contrast(1.1)",
          pointerEvents: "none",
          transform: "scale(1.08)",
        }}
        loading="lazy"
        title="loc"
      />
      {/* fade bottom into card */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(180deg, transparent 30%, rgba(8,12,16,0.92) 100%)`,
          pointerEvents: "none",
        }}
      />
      {/* status-colored top fade */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 18,
          background: `linear-gradient(180deg, ${glow}08, transparent)`,
          pointerEvents: "none",
        }}
      />
      {/* center pin */}
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: "50%",
          transform: "translate(-50%, -100%)",
          filter: `drop-shadow(0 0 5px ${glow}cc)`,
        }}
      >
        <MapPin color={glow} />
      </div>
      {/* coords */}
      <div
        style={{
          position: "absolute",
          bottom: 5,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            borderRadius: 99,
            background: "rgba(8,12,16,0.75)",
            border: `1px solid ${glow}25`,
            backdropFilter: "blur(4px)",
          }}
        >
          <MapPin color={glow} />
          <span
            style={{
              fontSize: 7,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "rgba(255,255,255,0.45)",
              fontFamily: "'DM Mono','Fira Code',monospace",
            }}
          >
            {parseFloat(lat).toFixed(3)}, {parseFloat(lng).toFixed(3)}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── ARRAY CARD ─────────────────────────────────────────────── */
function ArrayCard({ arr, onClick }) {
  const s = STATUS[arr.status];
  const effPct = (Number(arr.efficiency || 0) * 100).toFixed(0);

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        cursor: "pointer",
        borderRadius: 14,
        overflow: "hidden",
        background: s.bg,
        border: `1px solid ${s.border}`,
        boxShadow: `0 0 20px ${s.glow}15, 0 2px 8px rgba(0,0,0,0.5)`,
        transition: "transform 0.25s ease, box-shadow 0.25s ease",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.03) translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 0 35px ${s.glow}28, 0 4px 20px rgba(0,0,0,0.65)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1) translateY(0)";
        e.currentTarget.style.boxShadow = `0 0 20px ${s.glow}15, 0 2px 8px rgba(0,0,0,0.5)`;
      }}
    >
      {/* ── solar panel graphic ── */}
      <div style={{ padding: "10px 10px 0" }}>
        <div style={{ borderRadius: 6, overflow: "hidden", height: 46 }}>
          <SolarCellGrid status={arr.status} />
        </div>
      </div>

      {/* ── metrics ── */}
      <div
        style={{
          padding: "8px 10px 8px",
          display: "flex",
          flexDirection: "column",
          gap: 5,
        }}
      >
        {/* name + dot */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.6)",
            }}
          >
            {arr.name}
          </span>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: s.glow,
              boxShadow: `0 0 6px ${s.glow}`,
              animation: "pulse 2s infinite",
              display: "inline-block",
            }}
          />
        </div>

        {/* power + badge */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
            <span
              style={{
                fontSize: 19,
                fontWeight: 900,
                color: "#fff",
                lineHeight: 1,
              }}
            >
              {Number(arr.power || 0).toFixed(1)}
            </span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>
              W
            </span>
          </div>
          <span
            style={{
              fontSize: 7,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "2px 6px",
              borderRadius: 99,
              background: arr.isLive ? `${s.glow}18` : "rgba(255,255,255,0.05)",
              border: arr.isLive
                ? `1px solid ${s.glow}40`
                : "1px solid rgba(255,255,255,0.08)",
              color: arr.isLive ? s.glow : "rgba(255,255,255,0.28)",
            }}
          >
            {arr.isLive ? "● live" : "~ avg"}
          </span>
        </div>

        {/* efficiency */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 3,
            }}
          >
            <span
              style={{
                fontSize: 8,
                color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Eff
            </span>
            <span style={{ fontSize: 9, fontWeight: 700, color: s.glow }}>
              {effPct}%
            </span>
          </div>
          <div
            style={{
              height: 2,
              background: "rgba(255,255,255,0.07)",
              borderRadius: 99,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 99,
                width: `${effPct}%`,
                background: `linear-gradient(90deg, ${s.glow}77, ${s.glow})`,
                boxShadow: `0 0 5px ${s.glow}88`,
                transition: "width 0.7s ease",
              }}
            />
          </div>
        </div>

        {/* status badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            padding: "2px 7px",
            borderRadius: 99,
            fontSize: 8,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            background: `${s.glow}14`,
            border: `1px solid ${s.glow}28`,
            color: s.glow,
            alignSelf: "flex-start",
          }}
        >
          {s.icon} {s.label}
        </div>
      </div>

      {/* ── thin glow divider ── */}
      <div
        style={{
          height: 1,
          background: `linear-gradient(90deg, transparent, ${s.glow}22, transparent)`,
        }}
      />

      {/* ── map tile ── */}
      <div style={{ height: 86, flexShrink: 0 }}>
        <MapTile lat={arr.lat} lng={arr.lng} glow={s.glow} />
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────── */
export default function SolarFieldView() {
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);
  const arrays = useSelector((state) => state.auth.array);
  const socketSlice = useSelector((state) => state.socket);
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  /* ── stats ── */
  const total = arrays.length;
  const healthy = arrays.filter((a) => a.status === "healthy").length;
  const warning = arrays.filter((a) => a.status === "warning").length;
  const dirty = arrays.filter((a) => a.status === "cleaning").length;
  const totalPower = arrays.reduce((sum, a) => sum + Number(a.power || 0), 0);

  /* ── ON LOAD: fetch devices + history → compute averages ─────── */
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const stationId = auth?.user?.currentStation;
        if (!stationId) return;

        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/device/all/${stationId}`,
          { withCredentials: true },
        );

        const devices = res?.data?.devices || [];

        const mapped = await Promise.all(
          devices.map(async (d, i) => {
            try {
              const metricRes = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/api/device/get/single/${d._id}`,
                { withCredentials: true },
              );

              // history array from Redis cache
              const history = metricRes?.data?.history || [];
              const latest = metricRes?.data?.device || {};

              // ── use avg from history if available, else fall back to latest ──
              const { power, efficiency, irradiance } =
                history.length >= 2
                  ? avgFromHistory(history)
                  : {
                      power: latest.power || 0,
                      efficiency: latest.efficiency || 0,
                      irradiance: latest.irradiance || 0,
                    };

              return {
                id: d?._id || i,
                name: d?.name || `Array ${i + 1}`,
                power: power,
                efficiency: efficiency,
                irradiance: irradiance,
                status: getStatus(efficiency, irradiance),
                isLive: false,
                historyLen: history.length,
                lat: d?.location?.lat || null,
                lng: d?.location?.lng || null,
              };
            } catch {
              return {
                id: d?._id || i,
                name: d?.name || `Array ${i + 1}`,
                power: 0,
                efficiency: 0,
                irradiance: 0,
                status: "warning",
                isLive: false,
              };
            }
          }),
        );

        dispatch(setArray(mapped));
      } catch (err) {
        console.error("Device fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, [dispatch, auth?.user]);

  /* ── SOCKET: switch to live values when data arrives ─────────── */
  useEffect(() => {
    if (!socketSlice.socket) return;
    const socket = socketSlice.socket;

    const handler = (data) => {
      const dataFromSocket = typeof data === "string" ? JSON.parse(data) : data;
      const parsed = dataFromSocket.latest;
      const deviceId = parsed?.deviceId;
      if (!deviceId) return;

      const efficiency = parsed.efficiency || 0;
      const irradiance = parsed.irradiance || 0;

      const socketData = {
        id: deviceId,
        power: parsed.power || 0,
        efficiency: efficiency,
        irradiance: irradiance,
        voltage: parsed.voltage || 0,
        current: parsed.current || 0,
        expected_power: parsed.expected_power || 0,
        health_score: parsed.health_score || 0,
        temperature: parsed.temperature || 0,
        trust_score: parsed.trust_score || 0,
        battery: parsed.battery || 0,
        connectivity: parsed.connectivity || 0,
        status: getStatus(efficiency, irradiance),
        isLive: true, // ← mark as live
        deviceId,
      };

      dispatch(setArrayForPerticularData({ deviceId, socketData }));
    };

    socket.on("metric", handler);
    return () => socket.off("metric", handler);
  }, [socketSlice.socket]);

  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background: "#080c10",
        fontFamily: "'DM Mono', 'Fira Code', monospace",
      }}
    >
      {/* background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34,217,122,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,217,122,0.03) 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
      />

      {/* ambient glow blobs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -120,
          left: "30%",
          width: 500,
          height: 300,
          background:
            "radial-gradient(ellipse, rgba(34,217,122,0.07) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 0,
          right: "10%",
          width: 400,
          height: 300,
          background:
            "radial-gradient(ellipse, rgba(245,166,35,0.05) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* ── HEADER ── */}
      <div className="relative z-20 px-8 py-6 flex items-start justify-between border-b border-white/5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-2 h-8 rounded-sm"
              style={{
                background: "linear-gradient(180deg, #22d97a, #22d97a44)",
              }}
            />
            <h1
              className="text-2xl font-black tracking-tight text-white"
              style={{ letterSpacing: "-0.02em" }}
            >
              Solar Field Layout
            </h1>
          </div>
          <p className="text-white/35 text-xs tracking-widest uppercase ml-5">
            Real-time array monitoring — top view
          </p>
        </div>

        {/* live indicator + legend */}
        <div className="flex items-center gap-6 mt-1">
          {/* mode legend */}
          <div className="flex items-center gap-4 text-[9px] text-white/30 uppercase tracking-widest">
            <span className="flex items-center gap-1.5">
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#22d97a",
                  display: "inline-block",
                  boxShadow: "0 0 5px #22d97a",
                }}
              />
              Live
            </span>
            <span className="flex items-center gap-1.5">
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.25)",
                  display: "inline-block",
                }}
              />
              Avg (history)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "#22d97a", boxShadow: "0 0 8px #22d97a" }}
            />
            <span className="text-[10px] text-white/40 uppercase tracking-widest">
              Live
            </span>
          </div>
        </div>
      </div>

      {/* ── STAT BAR ── */}
      {!loading && (
        <div className="relative z-20 px-8 py-4 flex flex-wrap gap-6 border-b border-white/5">
          <Stat label="Total Arrays" value={total} color="#ffffff" />
          <Stat
            label="Total Power"
            value={`${totalPower.toFixed(1)} W`}
            color="#22d97a"
          />
          <Stat label="Optimal" value={healthy} color="#22d97a" />
          <Stat label="Degraded" value={warning} color="#f5a623" />
          <Stat label="Needs Cleaning" value={dirty} color="#f04b4b" />
          {/* how many are live vs avg */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
            <Stat
              label="Live feeds"
              value={arrays.filter((a) => a.isLive).length}
              color="#22d97a"
            />
            <Stat
              label="Avg feeds"
              value={arrays.filter((a) => !a.isLive).length}
              color="rgba(255,255,255,0.3)"
            />
          </div>
        </div>
      )}

      {/* ── LOADER ── */}
      {loading && (
        <div className="relative z-20 flex flex-col items-center justify-center mt-32 gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{
              borderColor: "rgba(255,255,255,0.1)",
              borderTopColor: "#22d97a",
            }}
          />
        </div>
      )}

      {/* ── GRID ── */}
      {!loading && (
        <div className="relative z-20 p-8">
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))",
              maxWidth: 1200,
              margin: "0 auto",
            }}
          >
            {arrays.map((arr) => (
              <ArrayCard
                key={arr.id}
                arr={arr}
                onClick={() => navigate(`/array/${arr.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── LEGEND ── */}
      {!loading && (
        <div className="relative z-20 pb-8 flex justify-center">
          <div
            className="flex gap-6 px-6 py-3 rounded-full border border-white/8"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <Legend color="#22d97a" label="Optimal" />
            <Legend color="#f5a623" label="Degraded" />
            <Legend color="#f04b4b" label="Needs Cleaning" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── STAT CHIP ─────────────────────────────────────────────── */
function Stat({ label, value, color }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] uppercase tracking-widest text-white/30">
        {label}
      </span>
      <span className="text-lg font-black leading-none" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

/* ─── LEGEND CHIP ───────────────────────────────────────────── */
function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-2 h-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}` }}
      />
      <span className="text-[10px] text-white/40 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}
