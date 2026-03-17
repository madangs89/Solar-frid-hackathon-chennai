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

/* ─── ARRAY CARD ─────────────────────────────────────────────── */
function ArrayCard({ arr, onClick }) {
  const s = STATUS[arr.status];
  const effPct = (Number(arr.efficiency || 0) * 100).toFixed(0);

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.04] hover:-translate-y-1 group"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        boxShadow: `0 0 18px ${s.glow}18, 0 2px 8px rgba(0,0,0,0.5)`,
      }}
    >
      {/* hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl pointer-events-none"
        style={{ boxShadow: `inset 0 0 28px ${s.glow}22` }}
      />

      {/* solar panel graphic */}
      <div className="px-3 pt-3 pb-0">
        <div className="rounded-md overflow-hidden" style={{ height: 56 }}>
          <SolarCellGrid status={arr.status} />
        </div>
      </div>

      {/* info */}
      <div className="px-3 pt-2 pb-3 space-y-1.5">
        {/* name + status dot */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-widest uppercase text-white/70">
            {arr.name}
          </span>
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: s.glow, boxShadow: `0 0 6px ${s.glow}` }}
          />
        </div>

        {/* power value + live/avg badge */}
        <div className="flex items-baseline justify-between gap-1">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-white leading-none">
              {Number(arr.power || 0).toFixed(1)}
            </span>
            <span className="text-[10px] text-white/40 font-medium">W</span>
          </div>
          {/* badge: AVG on load, LIVE after socket */}
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "2px 6px",
              borderRadius: 99,
              background: arr.isLive ? `${s.glow}18` : "rgba(255,255,255,0.06)",
              border: arr.isLive
                ? `1px solid ${s.glow}40`
                : "1px solid rgba(255,255,255,0.1)",
              color: arr.isLive ? s.glow : "rgba(255,255,255,0.3)",
            }}
          >
            {arr.isLive ? "● live" : "~ avg"}
          </span>
        </div>

        {/* efficiency bar */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[9px] text-white/40 uppercase tracking-wider">
              Efficiency
            </span>
            <span className="text-[10px] font-bold" style={{ color: s.glow }}>
              {effPct}%
            </span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${effPct}%`,
                background: `linear-gradient(90deg, ${s.glow}99, ${s.glow})`,
                boxShadow: `0 0 6px ${s.glow}88`,
              }}
            />
          </div>
        </div>

        {/* status badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            borderRadius: 99,
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            background: `${s.glow}18`,
            border: `1px solid ${s.glow}35`,
            color: s.glow,
          }}
        >
          <span>{s.icon}</span>
          {s.label}
        </div>
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
                isLive: false, // ← avg on load
                historyLen: history.length,
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
