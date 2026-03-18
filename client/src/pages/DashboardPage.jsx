import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Zap, Activity, Battery, Heart } from "lucide-react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

/* ─── helpers ──────────────────────────────────────────────── */
const getChange = (key, history) => {
  if (!history || history.length < 2) return 0;
  const prev = history[history.length - 2][key];
  const curr = history[history.length - 1][key];
  if (prev === 0) return 0;
  return (((curr - prev) / prev) * 100).toFixed(3);
};

const pct = (v) => Number((v || 0) * 100).toFixed(0);

/* ─── NEW: compute averages from history array ─────────────── */
function computeAvgs(history) {
  if (!history || history.length === 0) return null;
  const keys = [
    "voltage",
    "current",
    "power",
    "expected_power",
    "efficiency",
    "health_score",
    "temperature",
    "irradiance",
    "trust_score",
    "battery",
    "connectivity",
  ];
  const sums = {};
  keys.forEach((k) => (sums[k] = 0));
  history.forEach((r) => {
    keys.forEach((k) => (sums[k] += Number(r[k] || 0)));
  });
  const avgs = {};
  keys.forEach((k) => (avgs[k] = sums[k] / history.length));
  return avgs;
}

/* ─── TREND ANALYSIS ───────────────────────────────────────── */
// Linear regression slope — positive = rising, negative = falling
function calcSlope(history, key) {
  const n = history.length;
  if (n < 3) return 0;
  const vals = history.map((r, i) => ({ x: i, y: Number(r[key] || 0) }));
  const sumX = vals.reduce((s, v) => s + v.x, 0);
  const sumY = vals.reduce((s, v) => s + v.y, 0);
  const sumXY = vals.reduce((s, v) => s + v.x * v.y, 0);
  const sumX2 = vals.reduce((s, v) => s + v.x * v.x, 0);
  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

// Volatility — std deviation as % of mean
function calcVolatility(history, key) {
  const n = history.length;
  if (n < 3) return 0;
  const vals = history.map((r) => Number(r[key] || 0));
  const mean = vals.reduce((s, v) => s + v, 0) / n;
  if (mean === 0) return 0;
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  return (Math.sqrt(variance) / mean) * 100;
}

// Overall trend label from slope + volatility
function trendLabel(slope, volatility, scale = 1) {
  const norm = slope / scale; // normalise to [-1, 1] roughly
  if (volatility > 25)
    return { label: "Volatile", color: "#f5a623", icon: "⚡" };
  if (norm > 0.05) return { label: "Rising", color: "#22d97a", icon: "↗" };
  if (norm < -0.05) return { label: "Falling", color: "#f04b4b", icon: "↘" };
  return { label: "Stable", color: "#38bdf8", icon: "→" };
}

function computeTrends(history) {
  if (!history || history.length < 3) return null;
  const metrics = [
    "power",
    "efficiency",
    "health_score",
    "temperature",
    "irradiance",
    "trust_score",
  ];
  const scales = {
    power: 5,
    efficiency: 0.02,
    health_score: 2,
    temperature: 1,
    irradiance: 20,
    trust_score: 0.02,
  };
  const result = {};
  metrics.forEach((key) => {
    const slope = calcSlope(history, key);
    const vol = calcVolatility(history, key);
    const trend = trendLabel(slope, vol, scales[key] || 1);
    const first = Number(history[0][key] || 0);
    const last = Number(history[history.length - 1][key] || 0);
    const changePct =
      first !== 0 ? ((last - first) / Math.abs(first)) * 100 : 0;
    result[key] = { slope, volatility: vol, trend, changePct, first, last };
  });
  return result;
}

/* ─── TREND CARD ─────────────────────────────────────────────── */
function TrendCard({ label, unit, metricKey, trendData, history, color }) {
  if (!trendData) return null;
  const { trend, changePct, volatility, first, last } = trendData;
  const absChange = Math.abs(changePct);

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        border: `1px solid rgba(255,255,255,0.07)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* top accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${trend.color}, transparent)`,
        }}
      />

      {/* header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-white/40">
          {label}
        </span>
        <span className="text-sm font-black" style={{ color: trend.color }}>
          {trend.icon} {trend.label}
        </span>
      </div>

      {/* first → last */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-white/30 font-mono">
          {Number(first).toFixed(2)}
        </span>
        <div
          style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }}
        />
        <span className="text-[11px] font-black" style={{ color: trend.color }}>
          {Number(last).toFixed(2)}
          <span className="text-[9px] text-white/30 ml-1">{unit}</span>
        </span>
      </div>

      {/* sparkline */}
      <div style={{ height: 44, margin: "0 -4px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <Line
              dataKey={metricKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              style={{ filter: `drop-shadow(0 0 3px ${color}66)` }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* footer stats */}
      <div
        className="flex justify-between text-[9px] pt-1 border-t"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <span className="text-white/30">
          Change{" "}
          <span
            className="font-bold"
            style={{ color: changePct >= 0 ? C.green : C.red }}
          >
            {changePct >= 0 ? "+" : ""}
            {changePct.toFixed(1)}%
          </span>
        </span>
        <span className="text-white/30">
          Volatility{" "}
          <span
            className="font-bold"
            style={{
              color:
                volatility > 25
                  ? "#f5a623"
                  : volatility > 10
                    ? "#38bdf8"
                    : "rgba(255,255,255,0.5)",
            }}
          >
            {volatility.toFixed(1)}%
          </span>
        </span>
      </div>
    </div>
  );
}

/* ─── TREND SUMMARY BAR ──────────────────────────────────────── */
function TrendSummaryRow({ label, trendData, color }) {
  if (!trendData) return null;
  const { trend, changePct, volatility } = trendData;
  return (
    <div
      className="flex items-center gap-3 py-2 border-b"
      style={{ borderColor: "rgba(255,255,255,0.05)" }}
    >
      <span className="text-[10px] text-white/40 w-28 uppercase tracking-wider flex-shrink-0">
        {label}
      </span>
      <span
        className="text-sm font-black w-6 text-center"
        style={{ color: trend.color }}
      >
        {trend.icon}
      </span>
      <span
        className="text-[10px] font-bold w-16"
        style={{ color: trend.color }}
      >
        {trend.label}
      </span>
      <div
        className="flex-1 h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 99,
            width: `${Math.min(Math.abs(changePct), 100)}%`,
            background:
              changePct >= 0
                ? `linear-gradient(90deg, ${color}66, ${color})`
                : `linear-gradient(90deg, ${C.red}66, ${C.red})`,
            transition: "width 0.8s ease",
          }}
        />
      </div>
      <span
        className="text-[10px] font-bold w-14 text-right"
        style={{ color: changePct >= 0 ? C.green : C.red }}
      >
        {changePct >= 0 ? "+" : ""}
        {changePct.toFixed(1)}%
      </span>
      <span className="text-[9px] text-white/25 w-20 text-right">
        vol {volatility.toFixed(1)}%
      </span>
    </div>
  );
}

/* ─── theme ─────────────────────────────────────────────────── */
const C = {
  sun: "#FFB830",
  green: "#22d97a",
  red: "#f04b4b",
  blue: "#38bdf8",
  dim: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.08)",
};

const NoTooltip = () => null;

/* ─── STAT CARD ─────────────────────────────────────────────── */
function StatCard({
  icon: Icon,
  title,
  value,
  avgValue,
  unit,
  change,
  color,
  actual_key,
  history,
}) {
  const delta = Number(change);
  return (
    <div
      className="relative rounded-2xl p-5 flex flex-col gap-3 overflow-hidden transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02]"
      style={{
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        border: `1px solid ${C.border}`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)`,
      }}
    >
      {/* accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
        }}
      />

      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: `${color}18`, border: `1px solid ${color}30` }}
          >
            <Icon size={14} color={color} />
          </div>
          <span className="text-[10px] uppercase tracking-widest text-white/40">
            {title}
          </span>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
          style={{
            background:
              delta >= 0 ? "rgba(34,217,122,0.12)" : "rgba(240,75,75,0.12)",
            color: delta >= 0 ? C.green : C.red,
          }}
        >
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)}%
        </span>
      </div>

      {/* LIVE value */}
      <div className="flex items-baseline gap-1">
        <span
          className="text-3xl font-black text-white"
          style={{ letterSpacing: "-0.03em" }}
        >
          {value}
        </span>
        <span className="text-xs text-white/30 font-medium">{unit}</span>
      </div>

      {/* ── NEW: avg row ── */}
      {avgValue != null && (
        <div className="flex items-center gap-2 -mt-1">
          <span className="text-[9px] uppercase tracking-widest text-white/25">
            Avg
          </span>
          <span
            className="text-[11px] font-bold"
            style={{ color: `${color}bb` }}
          >
            {avgValue}
          </span>
          <span className="text-[9px] text-white/25">{unit}</span>
        </div>
      )}

      {/* sparkline */}
      <div className="h-10 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <Line
              dataKey={actual_key}
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─── RING GAUGE ─────────────────────────────────────────────── */
function RingGauge({ value, avgValue, color, label, size = 96 }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const fill = circ * (Math.min(Math.max(value, 0), 100) / 100);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 96 96">
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
        />
        <circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          strokeDashoffset={circ / 4}
          style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
        />
        <text
          x="48"
          y="48"
          textAnchor="middle"
          fill="white"
          fontSize="14"
          fontWeight="900"
          fontFamily="'DM Mono', monospace"
          dominantBaseline="middle"
        >
          {Number(value).toFixed(0)}%
        </text>
        {/* ── NEW: avg value below center ── */}
        {avgValue != null && (
          <text
            x="48"
            y="64"
            textAnchor="middle"
            fill={`${color}99`}
            fontSize="8"
            fontFamily="'DM Mono', monospace"
          >
            avg {Number(avgValue).toFixed(0)}%
          </text>
        )}
      </svg>
      <span className="text-[10px] text-white/40 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

/* ─── BAR ROW ────────────────────────────────────────────────── */
function BarRow({ label, value, avgValue, color }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1.5">
        <span className="text-white/50">{label}</span>
        <div className="flex items-center gap-3">
          {/* ── NEW: avg chip ── */}
          {avgValue != null && (
            <span className="text-[9px] text-white/30">
              avg{" "}
              <span style={{ color: `${color}aa` }}>
                {Number(avgValue).toFixed(0)}%
              </span>
            </span>
          )}
          <span className="font-bold" style={{ color }}>
            {Number(value).toFixed(0)}%
          </span>
        </div>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        {/* avg marker */}
        {avgValue != null && (
          <div
            style={{
              position: "relative",
              height: "100%",
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${Math.min(value, 100)}%`,
                background: `linear-gradient(90deg, ${color}88, ${color})`,
                boxShadow: `0 0 8px ${color}66`,
              }}
            />
            {/* avg tick */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: `${Math.min(avgValue, 100)}%`,
                width: 1,
                height: "100%",
                background: `${color}66`,
                transform: "translateX(-50%)",
              }}
            />
          </div>
        )}
        {avgValue == null && (
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.min(value, 100)}%`,
              background: `linear-gradient(90deg, ${color}88, ${color})`,
              boxShadow: `0 0 8px ${color}66`,
            }}
          />
        )}
      </div>
    </div>
  );
}

/* ─── CUSTOM TOOLTIP ─────────────────────────────────────────── */
const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{
        background: "#0f1a14",
        border: "1px solid rgba(34,217,122,0.2)",
      }}
    >
      {payload.map((p, i) => (
        <div key={i} className="flex gap-2">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-white font-bold">
            {Number(p.value).toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ─── AI CHAT ────────────────────────────────────────────────── */
function AIChat({ metrics, deviceId }) {
  const [messages, setMessages] = useState([
    {
      role: "model",
      text: "Hello! I'm monitoring your solar array in real time. Ask me anything about performance, alerts, or optimization.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", text: userMsg }]);
    setLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/ai/chat`,
        { message: userMsg, history: messages, deviceId },
        { withCredentials: true },
      );
      if (res.data.success)
        setMessages((m) => [...m, { role: "model", text: res.data.data }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "model", text: "Connection error. Please try again." },
      ]);
      toast.error("Failed to get response from AI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="rounded-2xl flex flex-col overflow-hidden"
      style={{
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
        border: `1px solid ${C.border}`,
        height: "100%",
        minHeight: 320,
      }}
    >
      <div
        className="px-5 py-4 flex items-center gap-3 border-b"
        style={{ borderColor: C.border }}
      >
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ background: C.green, boxShadow: `0 0 8px ${C.green}` }}
        />
        <span className="text-xs font-bold text-white uppercase tracking-widest">
          AI Microgrid Assistant
        </span>
      </div>
      <div
        className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-hide"
        style={{ maxHeight: 260 }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[80%] text-xs px-3 py-2 rounded-xl leading-relaxed"
              style={{
                background:
                  m.role === "user"
                    ? `linear-gradient(135deg, ${C.green}22, ${C.green}0e)`
                    : "rgba(255,255,255,0.05)",
                border: `1px solid ${m.role === "user" ? C.green + "30" : "rgba(255,255,255,0.08)"}`,
                color: m.role === "user" ? C.green : "rgba(255,255,255,0.75)",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div
              className="text-xs px-3 py-2 rounded-xl text-white/40"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div
        className="px-4 py-4 flex gap-2 border-t"
        style={{ borderColor: C.border }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about your microgrid..."
          className="flex-1 bg-transparent text-xs text-white placeholder-white/20 outline-none px-3 py-2 rounded-lg"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
        />
        <button
          onClick={send}
          disabled={loading}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition hover:scale-110 disabled:opacity-40"
          style={{ background: C.green, color: "#000" }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
          >
            <path
              d="M5 12h14M12 5l7 7-7 7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────── */
export default function Dashboard() {
  const socketSlice = useSelector((state) => state.socket);
  const params = useParams();

  const [metrics, setMetrics] = useState({
    voltage: 0,
    current: 0,
    power: 0,
    expected_power: 0,
    efficiency: 0,
    health_score: 0,
    temperature: 0,
    irradiance: 0,
    trust_score: 0,
    battery: 0,
    connectivity: 0,
  });
  const [history, setHistory] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);

  // ── running averages + trends computed from history ──────────
  const avgs = useMemo(() => computeAvgs(history), [history]);
  const trends = useMemo(() => computeTrends(history), [history]);

  const mapAlertToUI = (alert) => {
    const severityMap = {
      CRITICAL: "#ff4d4f",
      WARN: "#faad14",
      INFO: "rgba(255,255,255,0.25)",
    };
    const titleMap = {
      ZERO_OUTPUT: "No Power Output",
      LOW_PERFORMANCE: "Low Performance",
      OUTPUT_OVERSHOOT: "Output Overshoot",
      LOW_EFFICIENCY: "Low Efficiency",
      CRITICAL_EFFICIENCY: "Critical Efficiency",
      EFFICIENCY_DROP: "Efficiency Drop",
      CRITICAL_OVERHEAT: "Critical Overheat",
      OVERHEAT: "High Temperature",
      THERMAL_SPIKE: "Thermal Spike",
      UNDERVOLTAGE: "Undervoltage",
      ZERO_CURRENT: "No Current",
      SENSOR_FAILURE: "Sensor Failure",
      SENSOR_WARNING: "Sensor Warning",
      CONNECTIVITY_CRITICAL: "Connectivity Critical",
      CONNECTIVITY_WEAK: "Weak Connectivity",
      BATTERY_CRITICAL: "Battery Critical",
      BATTERY_LOW: "Battery Low",
      HEALTH_CRITICAL: "Critical Health",
      HEALTH_POOR: "Poor Health",
      HEALTH_DROP: "Health Drop",
    };
    return {
      id: alert._id || alert.timestamp,
      title: titleMap[alert.type] || alert.type.replaceAll("_", " "),
      body: alert.message,
      level: alert.severity,
      color: severityMap[alert.severity] || "#999",
      value: alert.value,
      timestamp: alert.timestamp,
    };
  };

  useEffect(() => {
    if (!socketSlice.socket) return;
    const socket = socketSlice.socket;
    const handler = (data) => {
      const d = typeof data === "string" ? JSON.parse(data) : data;
      const parsed = d.latest;
      if (parsed.deviceId !== params.id) return;
      setMetrics({
        voltage: parsed.voltage || 0,
        current: parsed.current || 0,
        power: (parsed.power || 0).toFixed(2),
        expected_power: parsed.expected_power || 0,
        efficiency: parsed.efficiency || 0,
        health_score: parsed.health_score || 0,
        temperature: parsed.temperature || 0,
        irradiance: parsed.irradiance || 0,
        trust_score: parsed.trust_score || 0,
        battery: parsed.battery || 0,
        connectivity: parsed.connectivity || 0,
      });
      // ── NEW: update history so avgs recompute automatically ──
      setHistory(d.history);
    };
    socket.on("metric", handler);
    return () => socket.off("metric", handler);
  }, [socketSlice.socket]);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/device/get/single/${params.id}`,
          { withCredentials: true },
        );
        if (res.data.success) {
          setMetrics(res.data.device);
          setHistory(res.data.history);
        }
      } catch (e) {
        console.log(e);
      }
    })();
  }, [params.id]);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/alerts/get-alerts/${params.id}`,
          { withCredentials: true },
        );
        if (res.data.success)
          setActiveAlerts(res.data.alerts.map(mapAlertToUI));
      } catch (e) {
        console.log(e);
      }
    })();
  }, [params.id]);

  useEffect(() => {
    if (!socketSlice.socket) return;
    const socket = socketSlice.socket;
    const handler = (data) => {
      const d = typeof data === "string" ? JSON.parse(data) : data;
      const parsed = d.alerts.map(mapAlertToUI);
      setActiveAlerts((prev) =>
        [
          ...parsed,
          ...prev.filter((a) => !parsed.some((p) => p.id === a.id)),
        ].slice(0, 10),
      );
    };
    socket.on("alerts", handler);
    return () => socket.off("alerts", handler);
  }, [socketSlice.socket]);

  const effPct = Number(pct(metrics.efficiency));
  const avgEffPct = avgs ? Number(avgs.efficiency * 100) : null;
  const avgIrradPct = avgs
    ? Math.min((avgs.irradiance / 1000) * 100, 100)
    : null;

  return (
    <div
      className="relative w-full"
      style={{
        background: "#060d0a",
        fontFamily: "'DM Mono', 'Fira Code', monospace",
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(34,217,122,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(34,217,122,0.025) 1px, transparent 1px)`,
          backgroundSize: "52px 52px",
          zIndex: 0,
        }}
      />
      <div
        className="fixed pointer-events-none"
        style={{
          top: 0,
          left: "20%",
          width: 600,
          height: 400,
          background: `radial-gradient(ellipse, ${C.green}09 0%, transparent 70%)`,
          filter: "blur(60px)",
          zIndex: 0,
        }}
      />
      <div
        className="fixed pointer-events-none"
        style={{
          bottom: 0,
          right: "5%",
          width: 500,
          height: 400,
          background: `radial-gradient(ellipse, ${C.sun}07 0%, transparent 70%)`,
          filter: "blur(60px)",
          zIndex: 0,
        }}
      />
      <div
        className="fixed pointer-events-none"
        style={{
          top: "40%",
          left: 0,
          width: 400,
          height: 400,
          background: `radial-gradient(ellipse, ${C.blue}05 0%, transparent 70%)`,
          filter: "blur(60px)",
          zIndex: 0,
        }}
      />

      <div className="relative z-10 max-w-[1400px] mx-auto px-5 md:px-8 py-8 space-y-6">
        {/* ── HEADER ── */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div
                className="w-1.5 h-10 rounded-full"
                style={{
                  background: `linear-gradient(180deg, ${C.green}, ${C.green}22)`,
                }}
              />
              <div>
                <h1
                  className="text-xl font-black text-white tracking-tight"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  Array Monitor
                </h1>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">
                  Microgrid Alpha · 12 Panels Active
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-1">
            {/* ── NEW: history window badge ── */}
            {history.length > 0 && (
              <div className="text-right">
                <div className="text-[9px] text-white/25 uppercase tracking-widest">
                  History window
                </div>
                <div className="text-xs font-bold text-white/50">
                  {history.length} readings
                </div>
              </div>
            )}
            <div className="text-right">
              <div className="text-[10px] text-white/30 uppercase tracking-widest">
                Voltage
              </div>
              <div className="text-lg font-black text-white">
                {Number(metrics.voltage).toFixed(2)}
                <span className="text-xs text-white/30 ml-1">V</span>
              </div>
            </div>
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-full"
              style={{
                background: `${C.green}14`,
                border: `1px solid ${C.green}30`,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: C.green, boxShadow: `0 0 8px ${C.green}` }}
              />
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: C.green }}
              >
                Live
              </span>
            </div>
          </div>
        </div>

        {/* ── STAT CARDS — now with avg ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            icon={Zap}
            title="Voltage"
            history={history}
            value={Number(metrics?.voltage || 0).toFixed(2)}
            avgValue={avgs ? avgs.voltage.toFixed(2) : null}
            unit="V"
            change={getChange("voltage", history)}
            color={C.green}
            actual_key="voltage"
          />
          <StatCard
            icon={Activity}
            title="Current"
            history={history}
            value={Number(metrics?.current || 0).toFixed(2)}
            avgValue={avgs ? avgs.current.toFixed(2) : null}
            unit="A"
            change={getChange("current", history)}
            color={C.blue}
            actual_key="current"
          />
          <StatCard
            icon={Zap}
            title="Power Output"
            history={history}
            value={Number(metrics?.power || 0).toFixed(2)}
            avgValue={avgs ? avgs.power.toFixed(2) : null}
            unit="W"
            change={getChange("power", history)}
            color={C.sun}
            actual_key="power"
          />
          <StatCard
            icon={Battery}
            title="Expected Power"
            history={history}
            value={Number(metrics?.expected_power || 0).toFixed(2)}
            avgValue={avgs ? avgs.expected_power.toFixed(2) : null}
            unit="W"
            change={getChange("expected_power", history)}
            color="#a78bfa"
            actual_key="expected_power"
          />
          <StatCard
            icon={Heart}
            title="Health Score"
            history={history}
            value={Number(metrics?.health_score || 0).toFixed(2)}
            avgValue={avgs ? avgs.health_score.toFixed(2) : null}
            unit=""
            change={getChange("health_score", history)}
            color={C.red}
            actual_key="health_score"
          />
        </div>

        {/* ── POWER CHART + EFFICIENCY ── */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div
            className="lg:col-span-2 rounded-2xl p-6"
            style={{
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
              border: `1px solid ${C.border}`,
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Power Generation
                </h3>
                <p className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">
                  Real-time · 30 min window
                  {/* ── NEW: avg power inline ── */}
                  {avgs && (
                    <span className="ml-3" style={{ color: `${C.green}88` }}>
                      · avg {avgs.power.toFixed(1)} W
                    </span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-white/40">
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-4 h-0.5 inline-block rounded"
                    style={{ background: C.green }}
                  />
                  Actual
                </span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-4 h-px inline-block rounded border-t-2 border-dashed"
                    style={{ borderColor: C.blue }}
                  />
                  Expected
                </span>
              </div>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid
                    stroke="rgba(255,255,255,0.04)"
                    strokeDasharray="4 4"
                  />
                  <XAxis dataKey="time" hide />
                  <YAxis hide />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    dataKey="power"
                    stroke={C.green}
                    strokeWidth={2.5}
                    dot={false}
                    name="Power"
                    style={{ filter: `drop-shadow(0 0 4px ${C.green}88)` }}
                  />
                  <Line
                    dataKey="expected_power"
                    stroke={C.blue}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Expected"
                  />
                  {/* ── NEW: avg power reference line via a flat data line ── */}
                  {avgs && (
                    <Line
                      dataKey={() => avgs.power}
                      stroke={`${C.green}44`}
                      strokeWidth={1}
                      strokeDasharray="2 6"
                      dot={false}
                      name="Avg Power"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* efficiency gauges — with avg */}
          <div
            className="rounded-2xl p-6 flex flex-col gap-5"
            style={{
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
              border: `1px solid ${C.border}`,
            }}
          >
            <h3 className="text-sm font-bold text-white">
              Efficiency & Irradiance
            </h3>
            <div className="flex justify-around flex-1 items-center">
              <RingGauge
                value={effPct}
                avgValue={avgEffPct}
                color={C.sun}
                label="Efficiency"
              />
              <RingGauge
                value={Math.min((metrics.irradiance / 1000) * 100, 100)}
                avgValue={avgIrradPct}
                color={C.blue}
                label="Irradiance"
              />
            </div>
            <div
              className="flex justify-between text-[10px] text-white/30 uppercase tracking-widest border-t pt-4"
              style={{ borderColor: C.border }}
            >
              <span className="text-red-400/70">Critical &lt;60%</span>
              <span className="text-amber-400/70">Warn &lt;75%</span>
              <span style={{ color: `${C.green}99` }}>Good ≥75%</span>
            </div>
          </div>
        </div>

        {/* ── HEALTH + ALERTS + AI ── */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* health factors — with avg ticks */}
          <div
            className="rounded-2xl p-6 space-y-5"
            style={{
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
              border: `1px solid ${C.border}`,
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Health Factors</h3>
              {/* ── NEW: avg health chip ── */}
              {avgs && (
                <span
                  className="text-[9px] px-2 py-1 rounded-full"
                  style={{
                    background: "rgba(34,217,122,0.08)",
                    color: `${C.green}99`,
                    border: "1px solid rgba(34,217,122,0.15)",
                  }}
                >
                  avg health {avgs.health_score.toFixed(0)}
                </span>
              )}
            </div>
            <BarRow
              label="Efficiency"
              value={metrics.efficiency * 100}
              avgValue={avgs ? avgs.efficiency * 100 : null}
              color={C.green}
            />
            <BarRow
              label="Sensor Confidence"
              value={metrics.trust_score * 100}
              avgValue={avgs ? avgs.trust_score * 100 : null}
              color={C.blue}
            />
            <BarRow
              label="Battery Level"
              value={metrics.battery}
              avgValue={avgs ? avgs.battery : null}
              color={C.sun}
            />
            <BarRow
              label="Connectivity"
              value={metrics.connectivity}
              avgValue={avgs ? avgs.connectivity : null}
              color="#a78bfa"
            />
            <div
              className="flex items-center justify-between mt-2 pt-4 border-t"
              style={{ borderColor: C.border }}
            >
              <span className="text-[10px] text-white/40 uppercase tracking-widest">
                Temperature
              </span>
              <div className="flex items-center gap-3">
                {/* ── NEW: avg temp ── */}
                {avgs && (
                  <span className="text-[9px] text-white/30">
                    avg{" "}
                    <span
                      style={{ color: avgs.temperature > 60 ? C.red : C.green }}
                    >
                      {avgs.temperature.toFixed(1)}°C
                    </span>
                  </span>
                )}
                <div
                  className="px-3 py-1.5 rounded-lg text-sm font-black"
                  style={{
                    background:
                      metrics.temperature > 60 ? `${C.red}18` : `${C.green}18`,
                    color: metrics.temperature > 60 ? C.red : C.green,
                    border: `1px solid ${metrics.temperature > 60 ? C.red : C.green}30`,
                  }}
                >
                  {Number(metrics.temperature).toFixed(1)}°C
                </div>
              </div>
            </div>
          </div>

          {/* smart alerts — unchanged */}
          <div
            className="rounded-2xl p-6"
            style={{
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
              border: `1px solid ${C.border}`,
            }}
          >
            <h3 className="text-sm font-bold text-white mb-5">Smart Alerts</h3>
            <div className="space-y-4">
              {activeAlerts && activeAlerts.length > 0 ? (
                activeAlerts.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    className="flex gap-3 p-3 rounded-xl"
                    style={{
                      background: `${a.color}08`,
                      border: `1px solid ${a.color}20`,
                    }}
                  >
                    <div
                      className="w-1 self-stretch rounded-full flex-shrink-0"
                      style={{ background: a.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs font-bold"
                          style={{ color: a.color }}
                        >
                          {a.title}
                        </span>
                        <span
                          className="text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest"
                          style={{ background: `${a.color}18`, color: a.color }}
                        >
                          {a.level}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/40 mt-0.5 leading-snug">
                        {a.body}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-white/40 py-4">
                  No active alerts.
                </div>
              )}
            </div>
          </div>

          <AIChat metrics={metrics} deviceId={params.id} />
        </div>

        {/* ── TRENDS SECTION ── */}
        {trends && (
          <div className="space-y-4">
            {/* section header */}
            <div className="flex items-center gap-3">
              <div
                className="w-1 h-6 rounded-full"
                style={{
                  background: `linear-gradient(180deg, #f5a623, #f5a62322)`,
                }}
              />
              <h2 className="text-sm font-black text-white uppercase tracking-widest">
                Trend Analysis
              </h2>
              <span className="text-[9px] text-white/25 uppercase tracking-widest ml-1">
                · {history.length} readings window
              </span>
            </div>

            {/* 6 trend cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <TrendCard
                label="Power"
                unit="W"
                metricKey="power"
                trendData={trends.power}
                history={history}
                color={C.sun}
              />
              <TrendCard
                label="Efficiency"
                unit=""
                metricKey="efficiency"
                trendData={trends.efficiency}
                history={history}
                color={C.green}
              />
              <TrendCard
                label="Health"
                unit=""
                metricKey="health_score"
                trendData={trends.health_score}
                history={history}
                color={C.red}
              />
              <TrendCard
                label="Temperature"
                unit="°C"
                metricKey="temperature"
                trendData={trends.temperature}
                history={history}
                color="#f97316"
              />
              <TrendCard
                label="Irradiance"
                unit="W/m²"
                metricKey="irradiance"
                trendData={trends.irradiance}
                history={history}
                color={C.blue}
              />
              <TrendCard
                label="Trust Score"
                unit=""
                metricKey="trust_score"
                trendData={trends.trust_score}
                history={history}
                color="#a78bfa"
              />
            </div>

            {/* summary table */}
            <div
              className="rounded-2xl p-5"
              style={{
                background:
                  "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
                border: `1px solid ${C.border}`,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Trend Summary</h3>
                <div className="flex items-center gap-4 text-[9px] text-white/25 uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <span style={{ color: C.green }}>↗</span> Rising
                  </span>
                  <span className="flex items-center gap-1">
                    <span style={{ color: C.red }}>↘</span> Falling
                  </span>
                  <span className="flex items-center gap-1">
                    <span style={{ color: C.blue }}>→</span> Stable
                  </span>
                  <span className="flex items-center gap-1">
                    <span style={{ color: "#f5a623" }}>⚡</span> Volatile
                  </span>
                </div>
              </div>
              <TrendSummaryRow
                label="Power Output"
                trendData={trends.power}
                color={C.sun}
              />
              <TrendSummaryRow
                label="Efficiency"
                trendData={trends.efficiency}
                color={C.green}
              />
              <TrendSummaryRow
                label="Health Score"
                trendData={trends.health_score}
                color={C.red}
              />
              <TrendSummaryRow
                label="Temperature"
                trendData={trends.temperature}
                color="#f97316"
              />
              <TrendSummaryRow
                label="Irradiance"
                trendData={trends.irradiance}
                color={C.blue}
              />
              <TrendSummaryRow
                label="Trust Score"
                trendData={trends.trust_score}
                color="#a78bfa"
              />

              {/* overall system trend verdict */}
              {(() => {
                const risingCount = Object.values(trends).filter(
                  (t) => t.trend.label === "Rising",
                ).length;
                const fallingCount = Object.values(trends).filter(
                  (t) => t.trend.label === "Falling",
                ).length;
                const volCount = Object.values(trends).filter(
                  (t) => t.trend.label === "Volatile",
                ).length;
                const verdict =
                  volCount >= 3
                    ? {
                        text: "System is highly volatile — sensor readings unstable",
                        color: "#f5a623",
                      }
                    : risingCount >= 4
                      ? {
                          text: "System trending positively across most metrics",
                          color: C.green,
                        }
                      : fallingCount >= 4
                        ? {
                            text: "System degrading — multiple metrics declining",
                            color: C.red,
                          }
                        : {
                            text: "System is stable with mixed metric trends",
                            color: C.blue,
                          };
                return (
                  <div
                    className="mt-4 pt-4 border-t flex items-center gap-3"
                    style={{ borderColor: "rgba(255,255,255,0.06)" }}
                  >
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{
                        background: verdict.color,
                        boxShadow: `0 0 6px ${verdict.color}`,
                      }}
                    />
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: verdict.color }}
                    >
                      {verdict.text}
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
