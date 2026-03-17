import Alert from "../models/alert.model.js";

export const getAlerts = async (req, res) => {
  try {
    const { deviceId } = req.params;
    if (!deviceId) {
      return res
        .status(400)
        .json({ message: "Device ID is required", success: false });
    }
    const alerts = await Alert.find({ deviceId }).sort({ timestamp: -1 });
    return res
      .status(200)
      .json({ alerts, success: true, message: "Alerts fetched successfully" });
  } catch (error) {
    console.error("Error fetching alerts:", error);
    return res.status(500).json({ message: "Failed to fetch alerts", success: false });
  }
};
