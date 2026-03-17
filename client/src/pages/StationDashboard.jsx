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
    badge: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30",
    label: "Optimal",
    icon: "●",
    cell: "from-emerald-400/20 to-emerald-900/30",
    cellLine: "rgba(34,217,122,0.25)",
  },
  warning: {
    glow: "#f5a623",
    bg: "rgba(245,166,35,0.07)",
    border: "rgba(245,166,35,0.35)",
    badge: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    label: "Degraded",
    icon: "▲",
    cell: "from-amber-400/20 to-amber-900/30",
    cellLine: "rgba(245,166,35,0.25)",
  },
  cleaning: {
    glow: "#f04b4b",
    bg: "rgba(240,75,75,0.07)",
    border: "rgba(240,75,75,0.35)",
    badge: "bg-red-500/20 text-red-300 border border-red-500/30",
    label: "Dirty",
    icon: "◆",
    cell: "from-red-400/20 to-red-900/30",
    cellLine: "rgba(240,75,75,0.2)",
  },
};

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
      {/* horizontal dividers */}
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
      {/* vertical dividers */}
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
      {/* diagonal shine */}
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
      {/* center glow */}
      <circle cx="40" cy="26" r="14" fill={s.glow} fillOpacity="0.06" />
    </svg>
  );
}

/* ─── ARRAY CARD ─────────────────────────────────────────────── */
function ArrayCard({ arr, onClick }) {
  const s = STATUS[arr.status];
  const effPct = (arr.efficiency * 100).toFixed(0);

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
      {/* glow pulse on hover */}
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

        {/* power */}
        <div className="flex items-baseline gap-1">
          <span className="text-lg font-black text-white leading-none">
            {arr.power}
          </span>
          <span className="text-[10px] text-white/40 font-medium">W</span>
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
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${s.badge}`}
        >
          <span style={{ color: s.glow }}>{s.icon}</span>
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
  let arrays = useSelector((state) => state.auth.array);
  const socketSlice = useSelector((state) => state.socket);
  const [loading, setLoading] = useState(true);
  let dispatch = useDispatch();

  /* ── stats ── */
  const total = arrays.length;
  const healthy = arrays.filter((a) => a.status === "healthy").length;
  const warning = arrays.filter((a) => a.status === "warning").length;
  const dirty = arrays.filter((a) => a.status === "cleaning").length;
  const totalPower = arrays.reduce((sum, a) => sum + Number(a.power || 0), 0);

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

              const latest = metricRes?.data?.device || {};
              const efficiency = latest.efficiency || 0;
              const irradiance = latest.irradiance || 0;
              const needsCleaning = efficiency < 0.6 && irradiance > 500;

              return {
                id: d?._id || i,
                name: d?.name || `Array ${i + 1}`,
                power: (latest.power || 0).toFixed(0),
                efficiency,
                status: needsCleaning
                  ? "cleaning"
                  : efficiency < 0.75
                    ? "warning"
                    : "healthy",
              };
            } catch {
              return {
                id: d?._id || i,
                name: d?.name || `Array ${i + 1}`,
                power: "0",
                efficiency: 0,
                status: "warning",
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

  useEffect(() => {
    if (!socketSlice.socket) return;
    const socket = socketSlice.socket;

    const handler = (data) => {
      const dataFromSocket = typeof data === "string" ? JSON.parse(data) : data;
      let parsed = dataFromSocket.latest;
      const deviceId = dataFromSocket.latest.deviceId;
      if (!deviceId) return;

      const needsCleaning = parsed.efficiency < 0.6 && parsed.irradiance > 500;
      let efficiency = parsed.efficiency || 0;

      let socketData = {
        id: deviceId,
        name: `Array `,
        voltage: parsed.voltage || 0,
        current: parsed.current || 0,
        power: (parsed.power || 0).toFixed(0),
        status: needsCleaning
          ? "cleaning"
          : efficiency < 0.75
            ? "warning"
            : "healthy",
        expected_power: parsed.expected_power || 0,
        efficiency: parsed.efficiency || 0,
        health_score: parsed.health_score || 0,
        temperature: parsed.temperature || 0,
        irradiance: parsed.irradiance || 0,
        trust_score: parsed.trust_score || 0,
        battery: parsed.battery || 0,
        connectivity: parsed.connectivity || 0,
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
      {/* ── background grid ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34,217,122,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,217,122,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── ambient glow blobs ── */}
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

        {/* live indicator */}
        <div className="flex items-center gap-2 mt-1">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "#22d97a", boxShadow: "0 0 8px #22d97a" }}
          />
          <span className="text-[10px] text-white/40 uppercase tracking-widest">
            Live
          </span>
        </div>
      </div>

      {/* ── STAT BAR ── */}
      {!loading && (
        <div className="relative z-20 px-8 py-4 flex flex-wrap gap-6 border-b border-white/5">
          <Stat label="Total Arrays" value={total} color="#ffffff" />
          <Stat
            label="Total Power"
            value={`${totalPower.toLocaleString()} W`}
            color="#22d97a"
          />
          <Stat label="Optimal" value={healthy} color="#22d97a" />
          <Stat label="Degraded" value={warning} color="#f5a623" />
          <Stat label="Needs Cleaning" value={dirty} color="#f04b4b" />
        </div>
      )}

      {/* ── LOADER ── */}
      {loading && (
        <div className="relative z-20 flex flex-col items-center justify-center mt-32 gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: "white", borderTopColor: "#22d97a" }}
          />
          {/* <span className="text-white/30 text-xs tracking-widest uppercase">
            Fetching arrays...
          </span> */}
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
