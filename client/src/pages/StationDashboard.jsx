import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { setArray, setArrayForPerticularData } from "../redux/Slice/authSlice";

/* 🎨 COLORS */
const statusStyles = {
  healthy: "bg-green-500/20 border-green-400 text-green-300",
  warning: "bg-yellow-500/20 border-yellow-400 text-yellow-300",
  cleaning: "bg-red-500/20 border-red-400 text-red-300",
};

export default function SolarFieldView() {
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);

  let arrays = useSelector((state) => state.auth.array);
  const socketSlice = useSelector((state) => state.socket);

  const [loading, setLoading] = useState(true);
  let dispatch = useDispatch();

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

        /* 🔥 IMPORTANT: fetch each device metric */
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
            } catch (err) {
              /* fallback if Redis empty */
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
      console.log(parsed);

      console.log(deviceId);

      if (!deviceId) return;
      const needsCleaning = parsed.efficiency < 0.6 && parsed.irradiance > 500;
      let efficiency = parsed.efficiency || 0;

      let socketData = {
        voltage: parsed.voltage || 0,
        current: parsed.current || 0,
        power: parsed.power || 0,
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

    return () => {
      socket.off("metric", handler);
    };
  }, [socketSlice.socket]);
  return (
    <div className="relative min-h-screen bg-black overflow-hidden font-['Manrope']">
      {/* 🔥 UPDATED BG (slightly cleaner) */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-[#050505] to-black"></div>

      {/* header */}
      <div className="relative z-20 px-8 py-6 text-white">
        <h1 className="text-2xl font-semibold">Solar Field Layout</h1>
        <p className="text-gray-400 text-sm">
          Real-time panel monitoring (top view)
        </p>
      </div>

      {/* LOADER */}
      {loading && (
        <div className="text-center text-gray-400 mt-20">Loading panels...</div>
      )}

      {/* FIELD */}
      {!loading && (
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
      )}

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
