import React from "react";
import { LineChart, Line, ResponsiveContainer, CartesianGrid } from "recharts";

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
  { t: "", actual: 60, expected: 90 },
  { t: "", actual: 62, expected: 88 },
  { t: "", actual: 61, expected: 89 },
  { t: "", actual: 65, expected: 90 },
  { t: "", actual: 64, expected: 88 },
  { t: "", actual: 66, expected: 90 },
  { t: "", actual: 67, expected: 91 },
];

function StatCard({ icon: Icon, title, value, unit, change, color }) {
  return (
    <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-4 flex flex-col justify-between">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Icon size={14} />
        {title}
      </div>

      <div className="text-2xl font-semibold mt-2">
        {value}
        <span className="text-sm text-gray-400 ml-1">{unit}</span>
      </div>

      <div className="flex items-center justify-between mt-3">
        <span
          className={`text-xs ${change > 0 ? "text-green-400" : "text-red-400"}`}
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
    <div className="space-y-6">
      {/* system bar */}

      <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg px-4 py-3 flex flex-col md:flex-row md:justify-between">
        <div className="text-green-400 text-sm">
          ● SYSTEM HEALTHY
          <span className="text-gray-400 ml-3 text-xs">
            Device: Microgrid Alpha · 12 Panels Active
          </span>
        </div>

        <div className="text-xs text-gray-400">
          Voltage: <span className="text-white">18.75V</span> · Updated just now
        </div>
      </div>

      {/* stat cards */}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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

      {/* main grid */}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* power generation */}

        <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-5">
          <div className="flex justify-between mb-4">
            <div>
              <h3 className="text-sm text-white">Power Generation</h3>
              <p className="text-xs text-gray-500">Real-time · 30 min window</p>
            </div>

            <span className="text-xs bg-[#1a1a1a] px-2 py-1 rounded">Live</span>
          </div>

          <div className="h-52">
            <ResponsiveContainer>
              <LineChart data={power}>
                <CartesianGrid stroke="#222" strokeDasharray="3 3" />

                <Line
                  dataKey="actual"
                  stroke="#e5e5e5"
                  strokeWidth={2}
                  dot={false}
                />

                <Line
                  dataKey="expected"
                  stroke="#6b7280"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* efficiency */}

        <div className="space-y-4">
          <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-5">
            <h3 className="text-sm text-white mb-3">Solar Efficiency</h3>

            <div className="text-3xl text-yellow-400 font-semibold">67%</div>

            <div className="w-full bg-[#1a1a1a] h-2 rounded mt-3">
              <div className="bg-yellow-500 h-2 rounded w-[67%]" />
            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span className="text-red-400">CRITICAL &lt;60</span>

              <span className="text-yellow-400">WARN 60-80</span>

              <span className="text-green-400">GOOD 80+</span>
            </div>
          </div>

          {/* health factors */}

          <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-5 space-y-4">
            <h3 className="text-sm text-white">Health Factors</h3>

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

                <div className="w-full bg-[#1a1a1a] h-2 rounded">
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

      {/* bottom grid */}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* alerts */}

        <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-5">
          <h3 className="text-sm text-white mb-4">AI Smart Alerts</h3>

          <div className="space-y-4">
            <div className="border-l-2 border-yellow-400 pl-3">
              <p className="text-yellow-400 text-sm">Efficiency Alert</p>
              <p className="text-xs text-gray-400">
                Panel efficiency dropped below 60% threshold
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

        {/* ai assistant */}

        <div className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm text-white mb-3">
              ● AI Microgrid Assistant
            </h3>

            <div className="bg-[#161616] rounded-lg p-3 text-xs text-gray-300">
              Hello! I'm your AI Microgrid Assistant. Ask me anything about your
              solar system performance, alerts, or maintenance needs.
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <input
              placeholder="Ask about your microgrid..."
              className="flex-1 bg-[#161616] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm"
            />

            <button className="bg-white text-black px-4 rounded-lg">➤</button>
          </div>
        </div>
      </div>
    </div>
  );
}
