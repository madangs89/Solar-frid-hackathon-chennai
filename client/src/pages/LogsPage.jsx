import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import axios from "axios";

/* ─── HELPERS ────────────────────────────────────────────────── */
function timeAgo(ts) {
  if (!ts) return "—";
  const diff = Date.now() - new Date(ts).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmt(v, dec = 2) {
  const n = Number(v);
  if (v == null || isNaN(n)) return "—";
  return n.toFixed(dec);
}

function healthColor(score) {
  const n = Number(score);
  if (n >= 75) return "#22d97a";
  if (n >= 50) return "#f5a623";
  return "#f04b4b";
}

function effColor(eff) {
  const n = Number(eff); // 0–1
  if (n >= 0.75) return "#22d97a";
  if (n >= 0.5) return "#f5a623";
  return "#f04b4b";
}

function tempColor(t) {
  const n = Number(t);
  if (n > 70) return "#f04b4b";
  if (n > 50) return "#f5a623";
  return "#22d97a";
}

function trustColor(t) {
  const n = Number(t);
  if (n >= 0.75) return "#22d97a";
  if (n >= 0.5) return "#f5a623";
  return "#f04b4b";
}

/* ─── PROGRESS BAR ───────────────────────────────────────────── */
function Bar({ value, max = 100, color }) {
  const pct = Math.min(100, Math.max(0, (Number(value) / max) * 100));
  return (
    <div
      style={{
        width: "100%",
        height: 4,
        background: "rgba(255,255,255,0.07)",
        borderRadius: 99,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: 99,
          boxShadow: `0 0 6px ${color}66`,
          transition: "width 0.6s ease",
        }}
      />
    </div>
  );
}

/* ─── METRIC CELL ────────────────────────────────────────────── */
function MetricCell({ label, value, unit, color, bar, barMax }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          fontSize: 9,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.28)",
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 800,
          color: color || "#fff",
          fontFamily: "'DM Mono','Fira Code',monospace",
          lineHeight: 1,
        }}
      >
        {value}
        {unit && (
          <span
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.35)",
              marginLeft: 3,
              fontWeight: 400,
            }}
          >
            {unit}
          </span>
        )}
      </span>
      {bar !== undefined && (
        <Bar value={bar} max={barMax || 100} color={color || "#22d97a"} />
      )}
    </div>
  );
}

/* ─── LOG CARD ───────────────────────────────────────────────── */
function LogCard({ log, isNew, idx }) {
  const [visible, setVisible] = useState(false);
  const hScore = Number(log.health_score ?? 0);
  const eff = Number(log.efficiency ?? 0);
  const hc = healthColor(hScore);
  const ec = effColor(eff);
  const tc = tempColor(log.temperature);
  const trc = trustColor(log.trust_score);
  const devId = log.deviceId
    ? String(log.deviceId).slice(-8).toUpperCase()
    : "————————";
  const power = Number(log.power ?? 0);
  const expPow = Number(log.expected_power ?? 0);
  const ratio = expPow > 0 ? Math.min(100, (power / expPow) * 100) : 0;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), Math.min(idx * 12, 300));
    return () => clearTimeout(t);
  }, [idx]);

  return (
    <div
      className="log-card"
      style={{
        display: "grid",
        gridTemplateColumns: "44px 120px 1fr 1fr 1fr 1fr 1fr 1fr 80px",
        alignItems: "center",
        gap: 0,
        padding: "14px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
        background: isNew ? "rgba(34,217,122,0.04)" : "transparent",
        cursor: "default",
      }}
    >
      {/* Index */}
      <div
        style={{
          paddingLeft: 24,
          fontSize: 10,
          fontWeight: 600,
          color: "rgba(255,255,255,0.15)",
          fontFamily: "'DM Mono',monospace",
        }}
      >
        {String(idx + 1).padStart(3, "0")}
      </div>

      {/* Device */}
      <div style={{ paddingRight: 12 }}>
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.28)",
            marginBottom: 4,
          }}
        >
          Device
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "rgba(255,255,255,0.7)",
            fontFamily: "'DM Mono',monospace",
            letterSpacing: "0.05em",
            background: "rgba(255,255,255,0.04)",
            padding: "3px 8px",
            borderRadius: 6,
            display: "inline-block",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          ···{devId.slice(-6)}
        </div>
        <div
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.2)",
            marginTop: 3,
            fontFamily: "monospace",
          }}
        >
          {timeAgo(log.timestamp)}
        </div>
      </div>

      {/* Power */}
      <div style={{ paddingRight: 16 }}>
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.28)",
            marginBottom: 6,
          }}
        >
          Power
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: "#fff",
            fontFamily: "'DM Mono',monospace",
            lineHeight: 1,
          }}
        >
          {fmt(log.power, 1)}
          <span
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.35)",
              marginLeft: 3,
            }}
          >
            W
          </span>
        </div>
        <div
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.3)",
            marginTop: 3,
            fontFamily: "monospace",
          }}
        >
          exp {fmt(log.expected_power, 1)} W
        </div>
        <div style={{ marginTop: 6 }}>
          <Bar value={ratio} max={100} color="#22d97a" />
        </div>
      </div>

      {/* Voltage / Current */}
      <div style={{ paddingRight: 16 }}>
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.28)",
            marginBottom: 6,
          }}
        >
          Voltage / Current
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "#e2b96f",
              fontFamily: "'DM Mono',monospace",
            }}
          >
            {fmt(log.voltage, 1)}
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
            V
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 2,
            marginTop: 2,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#a8d4ff",
              fontFamily: "'DM Mono',monospace",
            }}
          >
            {fmt(log.current, 2)}
          </span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>
            A
          </span>
        </div>
      </div>

      {/* Efficiency */}
      <div style={{ paddingRight: 16 }}>
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.28)",
            marginBottom: 6,
          }}
        >
          Efficiency
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: ec,
            fontFamily: "'DM Mono',monospace",
            lineHeight: 1,
          }}
        >
          {fmt(eff * 100, 1)}
          <span
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.35)",
              marginLeft: 2,
            }}
          >
            %
          </span>
        </div>
        <div style={{ marginTop: 6 }}>
          <Bar value={eff * 100} max={100} color={ec} />
        </div>
      </div>

      {/* Health */}
      <div style={{ paddingRight: 16 }}>
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.28)",
            marginBottom: 6,
          }}
        >
          Health
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: hc,
            fontFamily: "'DM Mono',monospace",
            lineHeight: 1,
          }}
        >
          {fmt(hScore, 1)}
          <span
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.35)",
              marginLeft: 2,
            }}
          >
            %
          </span>
        </div>
        <div style={{ marginTop: 6 }}>
          <Bar value={hScore} max={100} color={hc} />
        </div>
      </div>

      {/* Temperature + Irradiance */}
      <div style={{ paddingRight: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.28)",
                marginBottom: 3,
              }}
            >
              Temp
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: tc,
                fontFamily: "'DM Mono',monospace",
              }}
            >
              {fmt(log.temperature, 1)}
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.3)",
                  marginLeft: 2,
                }}
              >
                °C
              </span>
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.28)",
                marginBottom: 3,
              }}
            >
              Irradiance
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: "#e2c96f",
                fontFamily: "'DM Mono',monospace",
              }}
            >
              {fmt(log.irradiance, 0)}
              <span
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.3)",
                  marginLeft: 2,
                }}
              >
                W/m²
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Trust + Battery */}
      <div style={{ paddingRight: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.28)",
                marginBottom: 3,
              }}
            >
              Trust
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color: trc,
                fontFamily: "'DM Mono',monospace",
              }}
            >
              {fmt(log.trust_score, 2)}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 9,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.28)",
                marginBottom: 3,
              }}
            >
              Battery
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 800,
                color:
                  Number(log.battery) < 20
                    ? "#f04b4b"
                    : Number(log.battery) < 50
                      ? "#f5a623"
                      : "#22d97a",
                fontFamily: "'DM Mono',monospace",
              }}
            >
              {fmt(log.battery, 0)}
              <span
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.3)",
                  marginLeft: 2,
                }}
              >
                %
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Status pill */}
      <div
        style={{
          paddingRight: 24,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        {(() => {
          const score = Number(log.health_score ?? 0);
          const [label, color] =
            score >= 75
              ? ["Optimal", "#22d97a"]
              : score >= 50
                ? ["Degraded", "#f5a623"]
                : ["Poor", "#f04b4b"];
          return (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 99,
                background: `${color}14`,
                border: `1px solid ${color}30`,
                fontSize: 9,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: color,
                  display: "inline-block",
                  boxShadow: `0 0 5px ${color}`,
                }}
              />
              {label}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

/* ─── STAT CHIP ─────────────────────────────────────────────── */
function Stat({ label, value, color, unit }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span
        style={{
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "rgba(255,255,255,0.3)",
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 22,
          fontWeight: 900,
          lineHeight: 1,
          color: color || "#fff",
          fontFamily: "'DM Mono','Fira Code',monospace",
        }}
      >
        {value}
        {unit && (
          <span
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.3)",
              marginLeft: 3,
            }}
          >
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}

/* ─── MAIN ───────────────────────────────────────────────────── */
export default function LogsPage() {
  const socketSlice = useSelector((state) => state.socket);
  const socket = socketSlice?.socket;

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [error, setError] = useState(null);
  const [newIds, setNewIds] = useState(new Set());
  const [liveCount, setLiveCount] = useState(0);
  const [paused, setPaused] = useState(false);
  const [search, setSearch] = useState("");
  const pausedRef = useRef(false);
  const listRef = useRef(null);

  const fetchLogs = useCallback(async () => {
    setSpinning(true);
    setError(null);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/metric/all-logs`,
        { withCredentials: true },
      );
      if (data.success) {
        const sorted = (data.logs || []).sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
        );
        setLogs(sorted);
      } else throw new Error(data.message || "Failed");
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to fetch",
      );
    } finally {
      setLoading(false);
      setSpinning(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      if (pausedRef.current) return;
      const incoming = data?.latest;
      if (!incoming) return;
      const entry = { ...incoming, _liveId: `${Date.now()}-${Math.random()}` };
      setLogs((prev) => [entry, ...prev].slice(0, 500));
      setNewIds((prev) => new Set([...prev, entry._liveId]));
      setLiveCount((c) => c + 1);
      setTimeout(() => {
        setNewIds((prev) => {
          const n = new Set(prev);
          n.delete(entry._liveId);
          return n;
        });
      }, 4000);
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    };
    socket.on("metric", handler);
    return () => socket.off("metric", handler);
  }, [socket]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  const avgPower = logs.length
    ? logs.reduce((s, l) => s + Number(l.power || 0), 0) / logs.length
    : 0;
  const avgHealth = logs.length
    ? logs.reduce((s, l) => s + Number(l.health_score || 0), 0) / logs.length
    : 0;
  const avgTemp = logs.length
    ? logs.reduce((s, l) => s + Number(l.temperature || 0), 0) / logs.length
    : 0;
  const avgEff = logs.length
    ? logs.reduce((s, l) => s + Number(l.efficiency || 0), 0) / logs.length
    : 0;

  const filtered = search
    ? logs.filter(
        (l) =>
          l.deviceId &&
          String(l.deviceId).toLowerCase().includes(search.toLowerCase()),
      )
    : logs;

  return (
    <>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
        @keyframes spin  { to { transform: rotate(360deg); } }
        .log-card:hover  { background: rgba(255,255,255,0.02) !important; }
        .pill-btn        { cursor:pointer; transition:all 0.15s; font-family:'DM Mono','Fira Code',monospace; border:none; }
        .pill-btn:hover  { opacity:0.8; }
        ::-webkit-scrollbar       { width:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(34,217,122,0.15); border-radius:2px; }
        input { outline:none; }
        input::placeholder { color:rgba(255,255,255,0.2); }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#080c10",
          fontFamily: "'DM Mono','Fira Code',monospace",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: `
            linear-gradient(rgba(34,217,122,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,217,122,0.025) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />

        {/* Ambient glows */}
        <div
          style={{
            position: "absolute",
            top: -80,
            left: "20%",
            width: 600,
            height: 250,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse, rgba(34,217,122,0.07) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: "5%",
            width: 400,
            height: 280,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse, rgba(245,166,35,0.04) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* ── HEADER ── */}
        <div
          style={{
            position: "relative",
            zIndex: 20,
            padding: "28px 32px 20px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 36,
                  borderRadius: 2,
                  background:
                    "linear-gradient(180deg,#22d97a,rgba(34,217,122,0.1))",
                }}
              />
              <div>
                <h1
                  style={{
                    fontSize: 26,
                    fontWeight: 900,
                    color: "#fff",
                    margin: 0,
                    letterSpacing: "-0.03em",
                  }}
                >
                  Metric Logs
                </h1>
                <p
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.28)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    margin: "4px 0 0",
                  }}
                >
                  Raw sensor readings — all devices
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by device ID..."
              style={{
                fontFamily: "inherit",
                fontSize: 11,
                padding: "8px 16px",
                borderRadius: 99,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.7)",
                width: 200,
              }}
            />

            <button
              className="pill-btn"
              onClick={() => setPaused((p) => !p)}
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "8px 18px",
                borderRadius: 99,
                background: paused
                  ? "rgba(245,166,35,0.1)"
                  : "rgba(34,217,122,0.1)",
                border: paused
                  ? "1px solid rgba(245,166,35,0.4)"
                  : "1px solid rgba(34,217,122,0.35)",
                color: paused ? "#f5a623" : "#22d97a",
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              {paused ? (
                <>▶ Resume</>
              ) : (
                <>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#22d97a",
                      boxShadow: "0 0 7px #22d97a",
                      animation: "pulse 1.5s infinite",
                      display: "inline-block",
                    }}
                  />
                  Live
                </>
              )}
            </button>

            <button
              className="pill-btn"
              onClick={fetchLogs}
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "8px 18px",
                borderRadius: 99,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.45)",
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  animation: spinning ? "spin 1s linear infinite" : "none",
                }}
              >
                <path d="M13.5 2.5A7 7 0 1 0 14.5 8" strokeLinecap="round" />
                <path
                  d="M14.5 2.5V6.5H10.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* ── STATS ── */}
        {!loading && (
          <div
            style={{
              position: "relative",
              zIndex: 20,
              padding: "18px 32px",
              display: "flex",
              flexWrap: "wrap",
              gap: 40,
              alignItems: "center",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <Stat label="Total Readings" value={logs.length} color="#fff" />
            <Stat
              label="Avg Power"
              value={avgPower.toFixed(1)}
              color="#22d97a"
              unit="W"
            />
            <Stat
              label="Avg Health"
              value={avgHealth.toFixed(1)}
              color={healthColor(avgHealth)}
              unit="%"
            />
            <Stat
              label="Avg Eff"
              value={(avgEff * 100).toFixed(1)}
              color={effColor(avgEff)}
              unit="%"
            />
            <Stat
              label="Avg Temp"
              value={avgTemp.toFixed(1)}
              color="#e2b96f"
              unit="°C"
            />

            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              {liveCount > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "5px 14px",
                    borderRadius: 99,
                    background: "rgba(34,217,122,0.07)",
                    border: "1px solid rgba(34,217,122,0.2)",
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#22d97a",
                      boxShadow: "0 0 6px #22d97a",
                      display: "inline-block",
                      animation: "pulse 1.5s infinite",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      color: "#22d97a",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                    }}
                  >
                    +{liveCount} LIVE
                  </span>
                </div>
              )}
              <span
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.2)",
                  letterSpacing: "0.06em",
                }}
              >
                {filtered.length} entries
              </span>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {error && (
          <div
            style={{
              position: "relative",
              zIndex: 20,
              margin: "16px 32px 0",
              padding: "12px 18px",
              borderRadius: 10,
              background: "rgba(240,75,75,0.08)",
              border: "1px solid rgba(240,75,75,0.3)",
              color: "#f04b4b",
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="8" cy="8" r="7" />
              <path d="M8 5v4M8 11v.5" strokeLinecap="round" />
            </svg>
            {error}
          </div>
        )}

        {/* ── LOADER ── */}
        {loading && (
          <div
            style={{
              position: "relative",
              zIndex: 20,
              display: "flex",
              justifyContent: "center",
              marginTop: 120,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "2px solid rgba(34,217,122,0.15)",
                borderTopColor: "#22d97a",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        )}

        {/* ── COLUMN HEADERS ── */}
        {!loading && (
          <div
            style={{
              position: "relative",
              zIndex: 20,
              display: "grid",
              gridTemplateColumns: "44px 120px 1fr 1fr 1fr 1fr 1fr 1fr 80px",
              padding: "10px 0",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.015)",
            }}
          >
            {[
              "#",
              "Device",
              "Power",
              "V / A",
              "Efficiency",
              "Health",
              "Temp / Irrad",
              "Trust / Batt",
              "Status",
            ].map((h, i) => (
              <div
                key={h}
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "rgba(255,255,255,0.22)",
                  paddingLeft: i === 0 ? 24 : 0,
                  paddingRight: i === 8 ? 24 : 0,
                  textAlign: i === 8 ? "right" : "left",
                }}
              >
                {h}
              </div>
            ))}
          </div>
        )}

        {/* ── ROWS ── */}
        {!loading &&
          (filtered.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "100px 32px",
                color: "rgba(255,255,255,0.15)",
                fontSize: 13,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              No readings found
            </div>
          ) : (
            <div
              ref={listRef}
              style={{
                position: "relative",
                zIndex: 20,
                maxHeight: "calc(100vh - 320px)",
                overflowY: "auto",
              }}
            >
              {filtered.map((log, i) => (
                <LogCard
                  key={
                    log._liveId ||
                    log._id ||
                    `${log.deviceId}-${log.timestamp}-${i}`
                  }
                  log={log}
                  isNew={newIds.has(log._liveId)}
                  idx={i}
                />
              ))}
            </div>
          ))}
      </div>
    </>
  );
}
