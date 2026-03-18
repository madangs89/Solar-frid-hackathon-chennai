import { pubClient } from "../config/redis.js";
import Alert from "../models/alert.model.js";
import Device from "../models/device.model.js";
import User from "../models/user.model.js";
import { io } from "../server.js";

function generateAlerts(current, history) {
  const alerts = [];
  const prev5 = history.slice(-10);

  const flag = (type, severity, message, value) =>
    alerts.push({
      type,
      severity,
      message,
      value,
      timestamp: new Date(),
      deviceId: current.deviceId,
    });

  // ── POWER ──────────────────────────────────────────────
  if (current.power === 0 && current.irradiance > 400)
    flag(
      "ZERO_OUTPUT",
      "critical",
      "Zero power output during daylight hours",
      current.power,
    );

  if (current.performanceRatio < 0.5 && current.irradiance > 400)
    flag(
      "LOW_PERFORMANCE",
      "warning",
      "Performance ratio below 50% under good irradiance",
      current.performanceRatio,
    );

  if (
    current.power > current.expected_power * 1.5 &&
    current.expected_power > 0
  )
    flag(
      "OUTPUT_OVERVOLTAGE",
      "warning",
      "Output exceeds 150% of expected power",
      current.power,
    );

  // ── EFFICIENCY ─────────────────────────────────────────
  if (current.efficiency < 0.6 && current.irradiance > 500)
    flag(
      "NEEDS_CLEANING",
      "warning",
      "Low efficiency under high irradiance — panel may need cleaning",
      current.efficiency,
    );

  if (current.efficiency < 0.4)
    flag(
      "CRITICAL_EFFICIENCY",
      "critical",
      "Efficiency critically low",
      current.efficiency,
    );

  if (prev5.length >= 3) {
    const avgPrevEff =
      prev5.reduce((s, r) => s + r.efficiency, 0) / prev5.length;
    if (avgPrevEff - current.efficiency > 0.2)
      flag(
        "EFFICIENCY_DROP",
        "warning",
        "Sudden efficiency drop vs recent average",
        current.efficiency,
      );
  }

  // ── TEMPERATURE ────────────────────────────────────────
  if (current.temperature > 85)
    flag(
      "CRITICAL_OVERHEAT",
      "critical",
      "Panel temperature critically high — damage risk",
      current.temperature,
    );
  else if (current.temperature > 70)
    flag(
      "OVERHEAT",
      "warning",
      "Panel temperature above safe threshold",
      current.temperature,
    );

  if (current.temperature < 0)
    flag(
      "FROST",
      "info",
      "Panel temperature below freezing",
      current.temperature,
    );

  if (prev5.length >= 3) {
    const minPrevTemp = Math.min(...prev5.map((r) => r.temperature));
    if (current.temperature - minPrevTemp > 15)
      flag(
        "THERMAL_RUNAWAY",
        "critical",
        "Rapid temperature rise detected",
        current.temperature,
      );
  }

  // ── VOLTAGE / CURRENT ──────────────────────────────────
  if (current.voltage < 5 && current.irradiance > 300)
    flag(
      "UNDERVOLTAGE",
      "critical",
      "Near-zero voltage during irradiance — possible open circuit",
      current.voltage,
    );

  if (current.current === 0 && current.irradiance > 400)
    flag(
      "ZERO_CURRENT",
      "critical",
      "Zero current during daylight — possible disconnect",
      current.current,
    );

  // ── TRUST / SENSOR ─────────────────────────────────────
  if (current.trust_score < 0.3)
    flag(
      "SENSOR_FAULT",
      "critical",
      "Trust score critically low — sensor may be faulty",
      current.trust_score,
    );
  else if (current.trust_score < 0.5)
    flag(
      "SENSOR_UNRELIABLE",
      "warning",
      "Low trust score — readings may be inaccurate",
      current.trust_score,
    );

  if (prev5.length >= 3) {
    const allSameVoltage = prev5.every((r) => r.voltage === current.voltage);
    const allSameCurrent = prev5.every((r) => r.current === current.current);
    if (allSameVoltage && allSameCurrent && current.voltage !== 0)
      flag(
        "FROZEN_SENSOR",
        "warning",
        "Voltage and current unchanged across last readings — sensor may be stuck",
        current.voltage,
      );
  }

  // ── CONNECTIVITY ───────────────────────────────────────
  if (current.connectivity < 30)
    flag(
      "CONNECTIVITY_CRITICAL",
      "critical",
      "Connectivity critically low",
      current.connectivity,
    );
  else if (current.connectivity < 60)
    flag(
      "CONNECTIVITY_WEAK",
      "warning",
      "Connectivity below acceptable threshold",
      current.connectivity,
    );

  // ── BATTERY ────────────────────────────────────────────
  if (current.battery < 10)
    flag(
      "BATTERY_CRITICAL",
      "critical",
      "Battery critically low",
      current.battery,
    );
  else if (current.battery < 20)
    flag("BATTERY_LOW", "warning", "Battery below 20%", current.battery);

  if (current.battery < 50 && current.power > 5)
    flag(
      "CHARGING_FAULT",
      "warning",
      "Battery not charging despite power output",
      current.battery,
    );

  // ── HEALTH SCORE ───────────────────────────────────────
  if (current.health_score < 30)
    flag(
      "HEALTH_CRITICAL",
      "critical",
      "System health critically low",
      current.health_score,
    );
  else if (current.health_score < 50)
    flag(
      "HEALTH_POOR",
      "warning",
      "System health below acceptable level",
      current.health_score,
    );

  if (prev5.length >= 2) {
    const prevHealth = prev5[prev5.length - 1]?.health_score ?? 100;
    if (prevHealth - current.health_score > 20)
      flag(
        "HEALTH_DROP",
        "warning",
        "Sudden health score drop",
        current.health_score,
      );
  }

  // ── IRRADIANCE SENSOR ──────────────────────────────────
  if (current.irradiance === 0 && current.power > 5)
    flag(
      "IRRADIANCE_SENSOR_FAULT",
      "warning",
      "Power output detected but irradiance reads zero — sensor fault",
      current.irradiance,
    );

  if (current.irradiance > 800 && current.efficiency < 0.5)
    flag(
      "PEAK_UNDERPERFORM",
      "critical",
      "Severely underperforming during peak irradiance hours",
      current.efficiency,
    );

  return alerts;
}

export const addMetric = async (req, res) => {
  console.log("got request");

  try {
    const data = req.body;

    const {
      node_id,
      site_id,
      voltage = 0,
      current = 0,
      temperature = 0,
      irradiance = 0,
      trust_score = 0,
      deviceId,
      userId,
    } = data;

    if (!deviceId || !userId) {
      return res.status(400).json({
        message:
          "Missing required fields" + JSON.stringify({ deviceId, userId }),
        success: false,
      });
    }

    let battery = 70; // default
    let connectivity = 90;
    let panelCapacity = 20;

    let power = voltage * current;
    let expectedPower = panelCapacity * (irradiance / 1000);
    let timestamp = new Date();
    let rawEfficiency = 0;

    if (expectedPower > 10) {
      rawEfficiency = power / expectedPower;
    }

    // clamp between 0–1
    let efficiency = Math.min(Math.max(rawEfficiency, 0), 1);
    let performanceRatio = expectedPower > 0 ? power / expectedPower : 0;
    performanceRatio = Math.min(Math.max(performanceRatio, 0), 1);

    let healthScore =
      0.5 * performanceRatio +
      0.2 * trust_score +
      0.15 * (battery / 100) +
      0.15 * (connectivity / 100);

    healthScore = healthScore * 100;
    let key = `userId:${userId}:deviceId:${deviceId}`;
    const cachedValueFromRedis = await pubClient.get(key);

    let parsed;
    let history = [];
    if (cachedValueFromRedis) {
      parsed = JSON.parse(cachedValueFromRedis);

      const { deviceId, userId, metric } = parsed;

      metric.push({
        voltage,
        current,
        power,
        expected_power: expectedPower,
        efficiency,
        health_score: healthScore,
        temperature,
        irradiance,
        trust_score,
        timestamp,
        panelCapacity,
        battery,
        connectivity,
      });

      history = metric;

      // if (metric.length > 100) {
      //   metric.shift();
      // }

      await pubClient.set(
        `userId:${userId}:deviceId:${deviceId}`,
        JSON.stringify(parsed),
      );
    } else {
      let payload = {
        deviceId,
        userId,
        metric: [],
      };

      // here need to get from db for history

      payload.metric.push({
        voltage,
        current,
        power,
        expected_power: expectedPower,
        efficiency,
        health_score: healthScore,
        temperature,
        irradiance,
        trust_score,
        timestamp,
        panelCapacity,
        battery,
        connectivity,
      });

      history = payload.metric;
      await pubClient.set(key, JSON.stringify(payload));
    }

    // need to store this in redis

    let currentMetricPayload = {
      voltage,
      current,
      power,
      expected_power: expectedPower,
      efficiency,
      health_score: healthScore,
      temperature,
      irradiance,
      trust_score,
      timestamp,
      panelCapacity,
      battery,
      connectivity,
      deviceId,
      userId,
    };

    const alerts = generateAlerts(currentMetricPayload, history);

    io.to(userId).emit("metric", { latest: currentMetricPayload, history });

    if (alerts.length > 0) {
      io.to(userId).emit("alerts", { deviceId, alerts });
      await Alert.insertMany(alerts);
    }
    return res.status(200).json({
      message: "Collected the data successfully",
      success: true,
      data: currentMetricPayload,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to collect the data",
      success: false,
    });
  }
};

export const allLogs = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
        success: false,
      });
    }

    let logs = [];

    const userDetails = await User.findById(userId).lean();
    let stationId = userDetails.currentStation;

    const allDeviceIds = await Device.find({ stationId }).select("_id").lean();

    for (const device of allDeviceIds) {
      const deviceId = device._id.toString();
      const key = `userId:${userId}:deviceId:${deviceId}`;
      const cachedValueFromRedis = await pubClient.get(key);

      if (cachedValueFromRedis) {
        const parsed = JSON.parse(cachedValueFromRedis);
        logs.push(...parsed.metric);
      }
    }

    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.status(200).json({
      message: "Logs retrieved successfully",
      success: true,
      logs,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to retrieve logs",
      success: false,
    });
  }
};
