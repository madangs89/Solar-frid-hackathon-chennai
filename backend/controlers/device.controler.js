import { pubClient } from "../config/redis.js";
import Device from "../models/device.model.js";
import Station from "../models/stations.model.js";

export const createDevice = async (req, res) => {
  try {
    const { deviceType, stationId, name, location, capacity } = req.body;

    if (!deviceType || !stationId) {
      return res.status(400).json({
        message: "Device type and station ID are required",
        success: false,
      });
    }

    if (!name || !location || !capacity) {
      return res
        .status(400)
        .json({ message: "All fields required", success: false });
    }

    let installedAt = Date.now();

    const newDevice = await Device.create({
      deviceType,
      stationId,
      name,
      location,
      capacity,
      installedAt,
      status: "active",
    });

    const station = await Station.findById(stationId);

    if (!station) {
      return res.status(404).json({
        message: "Station not found",
        success: false,
      });
    }

    station.totalNumberOfArray += 1;
    station.numberOfWorkingArray += 1;
    station.numberOfDefectiveArray +=
      station.totalNumberOfArray - station.numberOfWorkingArray;
    await station.save();
    return res.status(201).json({
      message: "Device created",
      device: newDevice,
    });
  } catch (error) {
    console.log(error);

    return res
      .status(500)
      .json({ message: "Failed to create device", success: false });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({
        message: "All Fields are  required",
        success: false,
      });
    }

    const device = await Device.findById(id);

    if (!device) {
      return res.status(401).json({
        message: "Data not found",
        success: false,
      });
    }

    device.status = status;

    await device.save();

    return res.status(200).json({
      message: "Successfully we updated the data",
      success: true,
      device,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server issue while updating the status of device",
      success: false,
    });
  }
};

export const getAllDevicesOnBasisOfStations = async (req, res) => {
  try {
    const { stationId } = req.params;

    let userId = req?.user?._id;

    if (!stationId) {
      return res.status(400).json({
        message: "Station id is required",
        success: false,
      });
    }

    // let result = [];

    const devices = await Device.find({ stationId });
    // for (let device of devices) {
    //   const key = `userId:${userId}:deviceId:${device._id}`;
    //   const cached = await pubClient.get(key);
    //   result.push({
    //     ...device.toObject(),
    //   });
    // }

    return res.status(200).json({
      message: "Devices fetched successfully",
      success: true,
      devices,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server issue while fetching devices",
      success: false,
    });
  }
};

export const getDeviceDetailsbyId = async (req, res) => {
  try {
    const userId = req?.user?._id;
    const { deviceId } = req.params;

    /* ✅ validation */
    if (!userId || !deviceId) {
      return res.status(400).json({
        message: "UserId and DeviceId are required",
        success: false,
      });
    }

    const key = `userId:${userId}:deviceId:${deviceId}`;

    const cachedValueFromRedis = await pubClient.get(key);

    /* ❌ NO DATA IN REDIS */
    if (!cachedValueFromRedis) {
      return res.status(404).json({
        message: "No data found for this device (Redis empty)",
        success: false,
      });
    }

    /* ✅ SAFE PARSE */
    let parsed;
    try {
      parsed = JSON.parse(cachedValueFromRedis);
    } catch (err) {
      return res.status(500).json({
        message: "Failed to parse Redis data",
        success: false,
      });
    }

    /* ❌ INVALID STRUCTURE */
    if (!parsed || !parsed.metric || !Array.isArray(parsed.metric)) {
      return res.status(400).json({
        message: "Invalid data structure in Redis",
        success: false,
      });
    }

    const { deviceId: parsedDeviceId, userId: parsedUserId, metric } = parsed;

    /* ❌ EMPTY METRIC */
    if (!metric.length) {
      return res.status(404).json({
        message: "No metric data available",
        success: false,
      });
    }

    /* ✅ HISTORY */
    const history = metric.slice(-30);

    /* ✅ LATEST DATA */
    const latest = history[history.length - 1] || {};

    const currentData = {
      voltage: latest.voltage || 0,
      current: latest.current || 0,
      power: latest.power || 0,
      timestamp: latest.timestamp || null,
      expected_power: latest.expected_power || 0,
      efficiency: latest.efficiency || 0,
      health_score: latest.health_score || 0,
      temperature: latest.temperature || 0,
      irradiance: latest.irradiance || 0,
      trust_score: latest.trust_score || 0,
      battery: latest.battery || 0,
      connectivity: latest.connectivity || 0,
      panelCapacity: latest.panelCapacity || 0,
      deviceId: parsedDeviceId,
      userId: parsedUserId,
    };

    return res.status(200).json({
      message: "Device details fetched successfully",
      success: true,
      deviceId: parsedDeviceId,
      userId: parsedUserId,
      history,
      device: currentData,
    });
  } catch (error) {
    console.error("DEVICE FETCH ERROR:", error);

    return res.status(500).json({
      message: "Server issue while fetching device details",
      success: false,
    });
  }
};
