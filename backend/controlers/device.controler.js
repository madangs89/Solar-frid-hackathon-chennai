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

    if (!stationId) {
      return res.status(400).json({
        message: "Station id is required",
        success: false,
      });
    }

    const devices = await Device.find({ stationId });
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
