import React from "react";
import { LineChart, Line, ResponsiveContainer, CartesianGrid } from "recharts";

import { Zap, Activity, Battery, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

const getChange = (key, history) => {
  if (history == undefined) return 0;
  if (history && history.length < 2) return 0;

  const prev = history[history.length - 2][key];
  const curr = history[history.length - 1][key];
  console.log(key, history);

  if (prev === 0) return 0;

  return (((curr - prev) / prev) * 100).toFixed(3);
};

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
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-5 hover:bg-white/10 transition flex flex-col justify-between">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Icon size={16} />
        {title}
      </div>

      <div className="text-2xl md:text-3xl font-semibold mt-3 text-white">
        {value}
        <span className="text-sm text-gray-400 ml-1">{unit}</span>
      </div>

      <div className="flex justify-between items-center mt-4">
        <span
          className={`text-xs ${
            change > 0 ? "text-green-400" : "text-red-400"
          }`}
        >
          {change > 0 ? "▲" : "▼"} {Math.abs(change)}%
        </span>

        <div className="w-16 h-8">
          <ResponsiveContainer>
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
    </div>
  );
}

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
      const dataFromSocket = typeof data === "string" ? JSON.parse(data) : data;

      let parsed = dataFromSocket.latest;

      const deviceId = dataFromSocket.latest.deviceId;

      if (deviceId != params.id) return;
      setMetrics({
        voltage: parsed.voltage || 0,
        current: parsed.current || 0,
        power: parsed.power || 0,
        expected_power: parsed.expected_power || 0,
        efficiency: parsed.efficiency || 0,
        health_score: parsed.health_score || 0,
        temperature: parsed.temperature || 0,
        irradiance: parsed.irradiance || 0,
        trust_score: parsed.trust_score || 0,
        battery: parsed.battery || 0,
        connectivity: parsed.connectivity || 0,
      });
      setHistory(dataFromSocket.history);
    };

    socket.on("metric", handler);

    return () => {
      socket.off("metric", handler);
    };
  }, [socketSlice.socket]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black font-['Manrope']">
      {/* background image */}
      <img
        src="https://karim-saab.com/images/Frame-4_1.avif"
        className="absolute inset-0 w-full h-full object-cover scale-105"
        alt=""
      />

      {/* dark overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      {/* ambient lights */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-green-500/10 blur-[150px] rounded-full"></div>
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full"></div>

      <div className="relative z-20 max-w-[1400px] mx-auto px-5 md:px-8 py-8 space-y-8">
        {/* system status */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 flex flex-col md:flex-row md:justify-between gap-2">
          <div className="text-green-400 text-sm tracking-wide">
            ● SYSTEM HEALTHY
            <span className="text-gray-400 ml-3 text-xs">
              Device: Microgrid Alpha · 12 Panels Active
            </span>
          </div>

          <div className="text-xs text-gray-400">
            Voltage{" "}
            <span className="text-white">{metrics.voltage.toFixed(2)}V</span> ·
            Updated just now
          </div>
        </div>

        {/* stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            icon={Zap}
            title="Voltage"
            history={history}
            value={metrics.voltage.toFixed(2)}
            unit="V"
            change={getChange("voltage", history)}
            color="#22c55e"
            actual_key={"voltage"}
          />

          <StatCard
            icon={Activity}
            history={history}
            title="Current"
            value={metrics.current.toFixed(2)}
            unit="A"
            change={getChange("current", history)}
            color="#9ca3af"
            actual_key={"current"}
          />

          <StatCard
            icon={Zap}
            history={history}
            title="Power Output"
            value={metrics.power.toFixed(2)}
            unit="W"
            change={getChange("power")}
            color="#ef4444"
            actual_key={"power"}
          />

          <StatCard
            icon={Battery}
            history={history}
            title="Expected Power"
            value={metrics.expected_power.toFixed(2)}
            unit="W"
            change={getChange("expected_power", history)}
            color="#22c55e"
            actual_key={"expected_power"}
          />

          <StatCard
            icon={Heart}
            history={history}
            title="Health Score"
            value={metrics.health_score.toFixed(2)}
            unit=""
            change={getChange("health_score", history)}
            color="#9ca3af"
            actual_key={"health_score"}
          />
        </div>

        {/* charts section */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-white text-sm">Power Generation</h3>
                <p className="text-xs text-gray-400">
                  Real-time monitoring · 30 min window
                </p>
              </div>

              <span className="text-xs bg-green-500/10 text-green-400 px-3 py-1 rounded-full">
                LIVE
              </span>
            </div>

            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={history}>
                  <CartesianGrid stroke="#2a2a2a" strokeDasharray="3 3" />

                  <Line
                    dataKey="power"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={false}
                  />

                  <Line
                    dataKey="expected_power"
                    stroke="blue"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* efficiency + health */}
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5">
              <h3 className="text-white text-sm mb-3">Solar Efficiency</h3>

              <div className="text-4xl text-yellow-400 font-semibold">
                {(metrics.efficiency * 100).toFixed(0)}%
              </div>

              <div className="w-full bg-black/40 h-3 rounded mt-4 overflow-hidden">
                <div
                  className="bg-yellow-500 h-3 rounded shadow-[0_0_20px_#facc15]"
                  style={{
                    width: `${metrics.efficiency * 100}%`,
                  }}
                />
              </div>

              <div className="flex justify-between text-xs text-gray-400 mt-3">
                <span className="text-red-400">CRITICAL</span>
                <span className="text-yellow-400">WARN</span>
                <span className="text-green-400">GOOD</span>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 space-y-4">
              <h3 className="text-white text-sm">Health Factors</h3>

              {[
                { label: "Efficiency", value: metrics.efficiency * 100 },
                {
                  label: "Sensor Confidence",
                  value: metrics.trust_score * 100,
                },
                { label: "Battery Level", value: metrics.battery },
                { label: "Connectivity", value: metrics.connectivity },
              ].map((i) => (
                <div key={i.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{i.label}</span>
                    <span>{i.value.toFixed(0)}%</span>
                  </div>

                  <div className="w-full bg-black/40 h-2 rounded">
                    <div
                      className="bg-green-500 h-2 rounded"
                      style={{ width: `${i.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* bottom section */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5">
            <h3 className="text-white text-sm mb-4">AI Smart Alerts</h3>

            <div className="space-y-4">
              <div className="border-l-2 border-yellow-400 pl-3">
                <p className="text-yellow-400 text-sm">Efficiency Alert</p>
                <p className="text-xs text-gray-400">
                  Panel efficiency dropped below 60%
                </p>
              </div>

              <div className="border-l-2 border-red-500 pl-3">
                <p className="text-red-400 text-sm">Voltage Spike</p>
                <p className="text-xs text-gray-400">
                  Voltage exceeded 22V — possible inverter issue
                </p>
              </div>

              <div className="border-l-2 border-gray-500 pl-3">
                <p className="text-gray-300 text-sm">Dust Accumulation</p>
                <p className="text-xs text-gray-400">
                  Output reduced by 32% — cleaning recommended
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 flex flex-col">
            <h3 className="text-sm text-white mb-4">
              ● AI Microgrid Assistant
            </h3>

            <div className="bg-black/40 border border-white/10 rounded-lg p-4 text-sm text-gray-300">
              Hello! I'm monitoring your solar microgrid in real time.
            </div>

            <div className="flex gap-2 mt-4">
              <input
                placeholder="Ask about your microgrid..."
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
              />

              <button className="bg-white text-black px-4 rounded-lg hover:scale-105 transition">
                ➤
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
