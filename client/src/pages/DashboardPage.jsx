import React from "react";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { Zap, Activity, Battery, Heart } from "lucide-react";

const spark = [
  { v: 40 },
  { v: 45 },
  { v: 43 },
  { v: 50 },
  { v: 48 },
  { v: 55 },
  { v: 52 },
];

const power = [
  { actual: 60, expected: 90 },
  { actual: 62, expected: 88 },
  { actual: 61, expected: 89 },
  { actual: 65, expected: 90 },
  { actual: 64, expected: 88 },
  { actual: 66, expected: 90 },
  { actual: 67, expected: 91 },
];

function StatCard({ icon: Icon, title, value, unit, change, color }) {
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
            <LineChart data={spark}>
              <Line dataKey="v" stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}

export default function Dashboard() {
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
            Voltage <span className="text-white">18.75V</span> · Updated just now
          </div>

        </div>

        {/* stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">

          <StatCard
            icon={Zap}
            title="Voltage"
            value="18.75"
            unit="V"
            change={1.2}
            color="#22c55e"
          />

          <StatCard
            icon={Activity}
            title="Current"
            value="3.29"
            unit="A"
            change={-0.8}
            color="#9ca3af"
          />

          <StatCard
            icon={Zap}
            title="Power Output"
            value="60"
            unit="W"
            change={-2.1}
            color="#ef4444"
          />

          <StatCard
            icon={Battery}
            title="Expected Power"
            value="122"
            unit="W"
            change={0.3}
            color="#22c55e"
          />

          <StatCard
            icon={Heart}
            title="Health Score"
            value="73"
            unit=""
            change={-1.3}
            color="#9ca3af"
          />

        </div>

        {/* charts section */}
        <div className="grid lg:grid-cols-2 gap-6">

          {/* power chart */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 md:p-6">

            <div className="flex justify-between items-center mb-4">

              <div>
                <h3 className="text-white text-sm">
                  Power Generation
                </h3>

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
                <LineChart data={power}>

                  <CartesianGrid
                    stroke="#2a2a2a"
                    strokeDasharray="3 3"
                  />

                  <Line
                    dataKey="actual"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={false}
                  />

                  <Line
                    dataKey="expected"
                    stroke="#6b7280"
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

            {/* efficiency */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5">

              <h3 className="text-white text-sm mb-3">
                Solar Efficiency
              </h3>

              <div className="text-4xl text-yellow-400 font-semibold">
                67%
              </div>

              <div className="w-full bg-black/40 h-3 rounded mt-4 overflow-hidden">

                <div
                  className="bg-yellow-500 h-3 rounded shadow-[0_0_20px_#facc15]"
                  style={{ width: "67%" }}
                />

              </div>

              <div className="flex justify-between text-xs text-gray-400 mt-3">
                <span className="text-red-400">CRITICAL</span>
                <span className="text-yellow-400">WARN</span>
                <span className="text-green-400">GOOD</span>
              </div>

            </div>

            {/* health factors */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 space-y-4">

              <h3 className="text-white text-sm">
                Health Factors
              </h3>

              {[
                { label: "Efficiency", value: 67 },
                { label: "Sensor Confidence", value: 88 },
                { label: "Battery Level", value: 71 },
                { label: "Connectivity", value: 99 },
              ].map((i) => (

                <div key={i.label}>

                  <div className="flex justify-between text-xs mb-1">
                    <span>{i.label}</span>
                    <span>{i.value}%</span>
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

          {/* alerts */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5">

            <h3 className="text-white text-sm mb-4">
              AI Smart Alerts
            </h3>

            <div className="space-y-4">

              <div className="border-l-2 border-yellow-400 pl-3">
                <p className="text-yellow-400 text-sm">
                  Efficiency Alert
                </p>
                <p className="text-xs text-gray-400">
                  Panel efficiency dropped below 60%
                </p>
              </div>

              <div className="border-l-2 border-red-500 pl-3">
                <p className="text-red-400 text-sm">
                  Voltage Spike
                </p>
                <p className="text-xs text-gray-400">
                  Voltage exceeded 22V — possible inverter issue
                </p>
              </div>

              <div className="border-l-2 border-gray-500 pl-3">
                <p className="text-gray-300 text-sm">
                  Dust Accumulation
                </p>
                <p className="text-xs text-gray-400">
                  Output reduced by 32% — cleaning recommended
                </p>
              </div>

            </div>

          </div>

          {/* ai assistant */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-5 flex flex-col">

            <h3 className="text-sm text-white mb-4">
              ● AI Microgrid Assistant
            </h3>

            <div className="bg-black/40 border border-white/10 rounded-lg p-4 text-sm text-gray-300">
              Hello! I'm monitoring your solar microgrid in real time.
              Ask about system performance, alerts, or maintenance predictions.
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