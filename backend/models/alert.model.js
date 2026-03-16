import mongoose from "mongoose";
const AlertSchema = new mongoose.Schema({
  deviceId: String,

  type: {
    type: String,
    enum: [
      "inefficiency",
      "sensor_error",
      "maintenance",
      "battery_low",
      "ai_analysis",
    ],
  },

  message: String,

  severity: {
    type: String,
    enum: ["info", "warning", "critical"],
  },

  resolved: {
    type: Boolean,
    default: false,
  },

  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Alert = mongoose.model("Alert", AlertSchema);
export default Alert;
