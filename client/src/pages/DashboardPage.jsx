import React, { useEffect, useState, useRef } from "react";
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

/* ─── theme ─────────────────────────────────────────────────── */
const C = {
  sun: "#FFB830",
  green: "#22d97a",
  red: "#f04b4b",
  blue: "#38bdf8",
  dim: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.08)",
};

/* ─── tiny sparkline tooltip (suppressed) ───────────────────── */
const NoTooltip = () => null;

/* ─── STAT CARD ─────────────────────────────────────────────── */
function StatCard({
  icon: Icon,
  title,
  value,
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

      {/* value */}
      <div className="flex items-baseline gap-1">
        <span
          className="text-3xl font-black text-white"
          style={{ letterSpacing: "-0.03em" }}
        >
          {value}
        </span>
        <span className="text-xs text-white/30 font-medium">{unit}</span>
      </div>

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
function RingGauge({ value, color, label, size = 96 }) {
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
          y="52"
          textAnchor="middle"
          fill="white"
          fontSize="14"
          fontWeight="900"
          fontFamily="'DM Mono', monospace"
        >
          {Number(value).toFixed(0)}%
        </text>
      </svg>
      <span className="text-[10px] text-white/40 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

/* ─── BAR ROW ────────────────────────────────────────────────── */
function BarRow({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1.5">
        <span className="text-white/50">{label}</span>
        <span className="font-bold" style={{ color }}>
          {Number(value).toFixed(0)}%
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(value, 100)}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 8px ${color}66`,
          }}
        />
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
    // skip the initial mount so the page doesn't jump on load
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
        {
          message: userMsg,
          history: messages,
          deviceId: deviceId,
        },
        {
          withCredentials: true,
        },
      );

      if (res.data.success) {
        const reply = res.data.data;
        setMessages((m) => [...m, { role: "model", text: reply }]);
      }
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
      {/* header */}
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

      {/* messages */}
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

      {/* input */}
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

  const effPct = Number(pct(metrics.efficiency));

  return (
    <div
      className="relative w-full"
      style={{
        background: "#060d0a",
        fontFamily: "'DM Mono', 'Fira Code', monospace",
      }}
    >
      {/* ── background grid — fixed so navbar is never clipped ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(34,217,122,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(34,217,122,0.025) 1px, transparent 1px)`,
          backgroundSize: "52px 52px",
          zIndex: 0,
        }}
      />

      {/* ── ambient blobs — fixed, never push content ── */}
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

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            icon={Zap}
            title="Voltage"
            history={history}
            value={Number(metrics?.voltage || 0).toFixed(2)}
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
            unit=""
            change={getChange("health_score", history)}
            color={C.red}
            actual_key="health_score"
          />
        </div>

        {/* ── POWER CHART + EFFICIENCY ── */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* power chart — 2 cols */}
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
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* efficiency gauges */}
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
              <RingGauge value={effPct} color={C.sun} label="Efficiency" />
              <RingGauge
                value={Math.min((metrics.irradiance / 1000) * 100, 100)}
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
          {/* health factors */}
          <div
            className="rounded-2xl p-6 space-y-5"
            style={{
              background:
                "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",
              border: `1px solid ${C.border}`,
            }}
          >
            <h3 className="text-sm font-bold text-white">Health Factors</h3>
            <BarRow
              label="Efficiency"
              value={metrics.efficiency * 100}
              color={C.green}
            />
            <BarRow
              label="Sensor Confidence"
              value={metrics.trust_score * 100}
              color={C.blue}
            />
            <BarRow
              label="Battery Level"
              value={metrics.battery}
              color={C.sun}
            />
            <BarRow
              label="Connectivity"
              value={metrics.connectivity}
              color="#a78bfa"
            />
            {/* temp chip */}
            <div
              className="flex items-center justify-between mt-2 pt-4 border-t"
              style={{ borderColor: C.border }}
            >
              <span className="text-[10px] text-white/40 uppercase tracking-widest">
                Temperature
              </span>
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

          {/* smart alerts */}
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
              {[
                {
                  color: C.sun,
                  title: "Efficiency Alert",
                  body: "Panel efficiency dropped below 60%",
                  level: "WARN",
                },
                {
                  color: C.red,
                  title: "Voltage Spike",
                  body: "Voltage exceeded 22V — possible inverter issue",
                  level: "CRITICAL",
                },
                {
                  color: "rgba(255,255,255,0.25)",
                  title: "Dust Accumulation",
                  body: "Output reduced by 32% — cleaning recommended",
                  level: "INFO",
                },
              ].map((a) => (
                <div
                  key={a.title}
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
              ))}
            </div>
          </div>

          {/* AI chat */}
          <AIChat metrics={metrics} deviceId={params.id} />
        </div>
      </div>
    </div>
  );
}
