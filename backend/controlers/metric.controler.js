import { pubClient } from "../config/redis.js";
import { io } from "../server.js";

export const addMetric = async (req, res) => {
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
        message: "Missing required fields",
        success: false,
      });
    }

    let panelCapacity = 20;

    let power = voltage * current;
    let expectedPower = panelCapacity * (irradiance / 1000);
    let timestamp = new Date();
    let efficiency = power / expectedPower;
    healthScore =
      0.4 * efficiency +
      0.3 * (trust_score * 100) +
      0.2 * battery +
      0.1 * connectivity;

    const cachedValueFromRedis = await pubClient.hget(
      `userId:${userId}:deviceId:${deviceId}`,
    );

    let parsed;

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
      });

      await pubClient.hset(
        `userId:${userId}:deviceId:${deviceId}`,
        JSON.stringify(parsed),
      );
    } else {
      let key = `userId:${userId}:deviceId:${deviceId}`;

      let payload = {
        deviceId,
        userId,
        metric: [],
      };

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
      });

      await pubClient.hset(key, JSON.stringify(payload));
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
    };
    io.to(userId).emit("metric", currentMetricPayload);

    return res.status(200).json({
      message: "Collected the data successfully",
      success: true,
      data: data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to collect the data",
      success: false,
    });
  }
};
