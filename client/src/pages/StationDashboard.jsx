import React from "react";
import { useNavigate } from "react-router-dom";

/* 🔥 MOCK DATA */
const arrays = Array.from({ length: 24 }, (_, i) => {
  const efficiency = Math.random();
  const irradiance = 400 + Math.random() * 600;

  const needsCleaning = efficiency < 0.6 && irradiance > 500;

  return {
    id: `array_${i + 1}`,
    name: `A${i + 1}`,
    power: (Math.random() * 300).toFixed(0),
    efficiency,
    status: needsCleaning
      ? "cleaning"
      : efficiency < 0.75
        ? "warning"
        : "healthy",
  };
});

/* 🎨 COLORS */
const statusStyles = {
  healthy: "bg-green-500/20 border-green-400 text-green-300",
  warning: "bg-yellow-500/20 border-yellow-400 text-yellow-300",
  cleaning: "bg-red-500/20 border-red-400 text-red-300",
};

export default function SolarFieldView() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-black overflow-hidden font-['Manrope']">
      {/* background */}
      <img
        src="https://karim-saab.com/images/Frame-4_1.avif"
        className="absolute inset-0 w-full h-full object-cover opacity-30"
        alt=""
      />
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>

      {/* header */}
      <div className="relative z-20 px-8 py-6 text-white">
        <h1 className="text-2xl font-semibold">Solar Field Layout</h1>
        <p className="text-gray-400 text-sm">
          Real-time panel monitoring (top view)
        </p>
      </div>

      {/* FIELD */}
      <div className="relative z-20 p-8 grid grid-cols-4 md:grid-cols-6 gap-6 max-w-[1200px] mx-auto">
        {arrays.map((arr) => (
          <div
            key={arr.id}
            onClick={() => navigate(`/array/${arr.id}`)}
            className={`cursor-pointer rounded-lg border p-3 transition hover:scale-105 ${
              statusStyles[arr.status]
            }`}
          >
            {/* panel visual */}
            <div className="w-full h-16 bg-gradient-to-br from-blue-400/30 to-blue-800/40 rounded-md mb-3 border border-white/10"></div>

            {/* name */}
            <div className="text-xs font-semibold">{arr.name}</div>

            {/* power */}
            <div className="text-sm mt-1">⚡ {arr.power}W</div>

            {/* efficiency */}
            <div className="text-xs text-gray-300">
              {(arr.efficiency * 100).toFixed(0)}%
            </div>

            {/* status */}
            <div className="text-[10px] mt-1">
              {arr.status === "healthy" && "✅ Good"}
              {arr.status === "warning" && "⚠️ Low"}
              {arr.status === "cleaning" && "🧹 Clean"}
            </div>
          </div>
        ))}
      </div>

      {/* legend */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-6 text-xs text-gray-300">
        <Legend color="bg-green-400" label="Healthy" />
        <Legend color="bg-yellow-400" label="Warning" />
        <Legend color="bg-red-400" label="Needs Cleaning" />
      </div>
    </div>
  );
}

/* 🔹 legend */
function Legend({ color, label }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded ${color}`}></div>
      <span>{label}</span>
    </div>
  );
}
