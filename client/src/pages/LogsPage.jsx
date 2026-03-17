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
  if (v == null || v === "" || isNaN(Number(v))) return "—";
  return Number(v).toFixed(dec);
}

function healthColor(score) {
  if (score >= 75) return "#22d97a";
  if (score >= 50) return "#f5a623";
  return "#f04b4b";
}

function effColor(eff) {
  // eff is 0–1
  if (eff >= 0.75) return "#22d97a";
  if (eff >= 0.5) return "#f5a623";
  return "#f04b4b";
}

/* ─── METRIC BAR (mini sparkline-style bar) ──────────────────── */
function MiniBar({ value, max, color }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div
        style={{
          width: 40,
          height: 3,
          background: "rgba(255,255,255,0.08)",
          borderRadius: 99,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 99,
            boxShadow: `0 0 4px ${color}88`,
          }}
        />
      </div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color,
          fontFamily: "'DM Mono','Fira Code',monospace",
        }}
      >
        {fmt(value, 1)}
      </span>
    </div>
  );
}

/* ─── LOG ROW ────────────────────────────────────────────────── */
function LogRow({ log, isNew, idx }) {
  const [visible, setVisible] = useState(false);
  const hScore = Number(log.health_score ?? 0);
  const eff = Number(log.efficiency ?? 0);
  const hc = healthColor(hScore);
  const ec = effColor(eff);
  const devId = log.deviceId
    ? String(log.deviceId).slice(-6).toUpperCase()
    : "——";

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), idx * 8);
    return () => clearTimeout(t);
  }, [idx]);

  return (
    <div
      className="log-row"
      style={{
        display: "grid",
        gridTemplateColumns:
          "56px 70px 90px 90px 90px 90px 90px 90px 80px 70px",
        alignItems: "center",
        padding: "9px 0",
        borderBottom: "1px solid rgba(255,255,255,0.035)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(4px)",
        transition: "opacity 0.25s ease, transform 0.25s ease",
        background: isNew ? "rgba(34,217,122,0.05)" : "transparent",
      }}
    >
      {/* # index */}
      <div
        style={{
          paddingLeft: 20,
          fontSize: 9,
          color: "rgba(255,255,255,0.18)",
          fontFamily: "monospace",
        }}
      >
        {String(idx + 1).padStart(3, "0")}
      </div>

      {/* Device */}
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "rgba(255,255,255,0.5)",
          fontFamily: "'DM Mono',monospace",
        }}
      >
        ···{devId}
      </div>

      {/* Power */}
      <div>
        <div
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.3)",
            marginBottom: 2,
            letterSpacing: "0.06em",
          }}
        >
          POWER
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#fff",
            fontFamily: "monospace",
          }}
        >
          {fmt(log.power, 1)}
          <span
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.35)",
              marginLeft: 2,
            }}
          >
            W
          </span>
          <span
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.25)",
              marginLeft: 4,
            }}
          >
            / {fmt(log.expected_power, 1)}W
          </span>
        </div>
      </div>

      {/* Voltage / Current */}
      <div>
        <div
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.3)",
            marginBottom: 2,
            letterSpacing: "0.06em",
          }}
        >
          V / A
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#e2b96f",
            fontFamily: "monospace",
          }}
        >
          {fmt(log.voltage, 1)}
          <span
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.3)",
              margin: "0 3px",
            }}
          >
            V
          </span>
          <span style={{ color: "rgba(255,255,255,0.25)" }}>/</span>
          <span style={{ marginLeft: 3 }}>{fmt(log.current, 2)}</span>
          <span
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.3)",
              marginLeft: 2,
            }}
          >
            A
          </span>
        </div>
      </div>

      {/* Efficiency */}
      <div>
        <div
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.3)",
            marginBottom: 3,
            letterSpacing: "0.06em",
          }}
        >
          EFF
        </div>
        <MiniBar value={eff * 100} max={100} color={ec} />
      </div>

      {/* Health */}
      <div>
        <div
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.3)",
            marginBottom: 3,
            letterSpacing: "0.06em",
          }}
        >
          HEALTH
        </div>
        <MiniBar value={hScore} max={100} color={hc} />
      </div>

      {/* Temperature */}
      <div>
        <div
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.3)",
            marginBottom: 2,
            letterSpacing: "0.06em",
          }}
        >
          TEMP
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "monospace",
            color:
              Number(log.temperature) > 70
                ? "#f04b4b"
                : Number(log.temperature) > 50
                  ? "#f5a623"
                  : "#22d97a",
          }}
        >
          {fmt(log.temperature, 1)}
          <span
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.3)",
              marginLeft: 2,
            }}
          >
            °C
          </span>
        </div>
      </div>

      {/* Irradiance */}
      <div>
        <div
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.3)",
            marginBottom: 2,
            letterSpacing: "0.06em",
          }}
        >
          IRRAD
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#e2c96f",
            fontFamily: "monospace",
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

      {/* Trust */}
      <div>
        <div
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.3)",
            marginBottom: 2,
            letterSpacing: "0.06em",
          }}
        >
          TRUST
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            fontFamily: "monospace",
            color:
              Number(log.trust_score) < 0.5
                ? "#f04b4b"
                : Number(log.trust_score) < 0.75
                  ? "#f5a623"
                  : "#22d97a",
          }}
        >
          {fmt(log.trust_score, 2)}
        </div>
      </div>

      {/* Time */}
      <div
        style={{
          paddingRight: 20,
          fontSize: 9,
          color: "rgba(255,255,255,0.22)",
          letterSpacing: "0.04em",
          textAlign: "right",
          fontFamily: "monospace",
        }}
      >
        {timeAgo(log.timestamp)}
      </div>
    </div>
  );
}

/* ─── STAT CHIP ─────────────────────────────────────────────── */
function Stat({ label, value, color, unit }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span
        style={{
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.3)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 18,
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
              fontSize: 11,
              color: "rgba(255,255,255,0.35)",
              marginLeft: 2,
            }}
          >
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}

/* ─── MAIN COMPONENT ─────────────────────────────────────────── */
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

  /* ── Fetch logs ── */
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
      } else {
        throw new Error(data.message || "Failed");
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to fetch logs",
      );
    } finally {
      setLoading(false);
      setSpinning(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  /* ── Socket: live metric updates ── */
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      if (pausedRef.current) return;
      const incoming = data?.latest;
      if (!incoming) return;

      const withId = { ...incoming, _liveId: `${Date.now()}-${Math.random()}` };
      setLogs((prev) => [withId, ...prev].slice(0, 500));
      setNewIds((prev) => new Set([...prev, withId._liveId]));
      setLiveCount((c) => c + 1);
      setTimeout(() => {
        setNewIds((prev) => {
          const n = new Set(prev);
          n.delete(withId._liveId);
          return n;
        });
      }, 4000);
      if (listRef.current)
        listRef.current.scrollTo({ top: 0, behavior: "smooth" });
    };
    socket.on("metric", handler);
    return () => socket.off("metric", handler);
  }, [socket]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  /* ── Derived stats ── */
  const avgPower = logs.length
    ? logs.reduce((s, l) => s + Number(l.power || 0), 0) / logs.length
    : 0;
  const avgHealth = logs.length
    ? logs.reduce((s, l) => s + Number(l.health_score || 0), 0) / logs.length
    : 0;
  const avgTemp = logs.length
    ? logs.reduce((s, l) => s + Number(l.temperature || 0), 0) / logs.length
    : 0;

  /* ── Filter by device search ── */
  const filtered = search
    ? logs.filter(
        (l) =>
          l.deviceId &&
          String(l.deviceId).toLowerCase().includes(search.toLowerCase()),
      )
    : logs;

  const COLS = [
    "#",
    "Device",
    "Power / Expected",
    "Voltage / Current",
    "Efficiency",
    "Health",
    "Temperature",
    "Irradiance",
    "Trust",
    "Time",
  ];

  return (
    <>
      <style>{`
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin   { to { transform: rotate(360deg); } }
        .log-row:hover    { background: rgba(255,255,255,0.025) !important; }
        .pill-btn         { cursor:pointer; transition: all 0.15s; font-family:'DM Mono','Fira Code',monospace; border:none; }
        .pill-btn:hover   { opacity:0.8; }
        ::-webkit-scrollbar       { width:3px; height:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(34,217,122,0.18); border-radius:2px; }
        input::placeholder { color: rgba(255,255,255,0.2); }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          position: "relative",
          background: "#080c10",
          fontFamily: "'DM Mono', 'Fira Code', monospace",
          overflow: "hidden",
        }}
      >
        {/* Grid bg */}
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

        {/* Glow blobs */}
        <div
          style={{
            position: "absolute",
            top: -60,
            left: "25%",
            width: 500,
            height: 200,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse, rgba(34,217,122,0.06) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: "10%",
            width: 350,
            height: 250,
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
            padding: "22px 28px",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 14,
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 4,
              }}
            >
              <div
                style={{
                  width: 3,
                  height: 30,
                  borderRadius: 2,
                  background:
                    "linear-gradient(180deg, #22d97a, rgba(34,217,122,0.15))",
                }}
              />
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 900,
                  color: "#fff",
                  margin: 0,
                  letterSpacing: "-0.02em",
                }}
              >
                Metric Logs
              </h1>
            </div>
            <p
              style={{
                fontSize: 9,
                color: "rgba(255,255,255,0.28)",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                margin: "0 0 0 15px",
              }}
            >
              Raw sensor readings — all devices
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {/* Search by device */}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by device ID..."
              style={{
                fontFamily: "inherit",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.06em",
                padding: "5px 12px",
                borderRadius: 99,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.6)",
                outline: "none",
                width: 160,
              }}
            />

            {/* Live / Pause */}
            <button
              className="pill-btn"
              onClick={() => setPaused((p) => !p)}
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "5px 14px",
                borderRadius: 99,
                background: paused
                  ? "rgba(245,166,35,0.12)"
                  : "rgba(34,217,122,0.1)",
                border: paused
                  ? "1px solid rgba(245,166,35,0.4)"
                  : "1px solid rgba(34,217,122,0.35)",
                color: paused ? "#f5a623" : "#22d97a",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {paused ? (
                <>▶ Resume</>
              ) : (
                <>
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "#22d97a",
                      boxShadow: "0 0 6px #22d97a",
                      animation: "pulse 1.5s infinite",
                      display: "inline-block",
                    }}
                  />
                  Live
                </>
              )}
            </button>

            {/* Refresh */}
            <button
              className="pill-btn"
              onClick={fetchLogs}
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "5px 14px",
                borderRadius: 99,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.4)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg
                width="10"
                height="10"
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

        {/* ── STAT BAR ── */}
        {!loading && (
          <div
            style={{
              position: "relative",
              zIndex: 20,
              padding: "12px 28px",
              display: "flex",
              flexWrap: "wrap",
              gap: 24,
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
              label="Avg Temp"
              value={avgTemp.toFixed(1)}
              color="#e2b96f"
              unit="°C"
            />
            {liveCount > 0 && (
              <div
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "4px 12px",
                  borderRadius: 99,
                  background: "rgba(34,217,122,0.07)",
                  border: "1px solid rgba(34,217,122,0.2)",
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#22d97a",
                    boxShadow: "0 0 5px #22d97a",
                    display: "inline-block",
                    animation: "pulse 1.5s infinite",
                  }}
                />
                <span
                  style={{
                    fontSize: 9,
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
                fontSize: 9,
                color: "rgba(255,255,255,0.18)",
                letterSpacing: "0.06em",
                marginLeft: liveCount > 0 ? 0 : "auto",
              }}
            >
              {filtered.length} entries
            </span>
          </div>
        )}

        {/* ── ERROR ── */}
        {error && (
          <div
            style={{
              position: "relative",
              zIndex: 20,
              margin: "14px 28px 0",
              padding: "10px 16px",
              borderRadius: 8,
              background: "rgba(240,75,75,0.08)",
              border: "1px solid rgba(240,75,75,0.3)",
              color: "#f04b4b",
              fontSize: 11,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <svg
              width="13"
              height="13"
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
              marginTop: 100,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                border: "2px solid rgba(34,217,122,0.15)",
                borderTopColor: "#22d97a",
                animation: "spin 1s linear infinite",
              }}
            />
          </div>
        )}

        {/* ── TABLE ── */}
        {!loading && (
          <div style={{ position: "relative", zIndex: 20, overflowX: "auto" }}>
            {/* Column headers */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "56px 70px 90px 90px 90px 90px 90px 90px 80px 70px",
                padding: "7px 0",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.01)",
                minWidth: 820,
              }}
            >
              {COLS.map((h, i) => (
                <div
                  key={h}
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.25)",
                    paddingLeft: i === 0 ? 20 : 0,
                    paddingRight: i === COLS.length - 1 ? 20 : 0,
                    textAlign: i === COLS.length - 1 ? "right" : "left",
                  }}
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            {filtered.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 32px",
                  color: "rgba(255,255,255,0.18)",
                  fontSize: 12,
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
                  maxHeight: "calc(100vh - 280px)",
                  overflowY: "auto",
                  minWidth: 820,
                }}
              >
                {filtered.map((log, i) => (
                  <LogRow
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
            )}
          </div>
        )}
      </div>
    </>
  );
}
