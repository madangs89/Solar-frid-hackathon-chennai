import mongoose from "mongoose";
const AlertSchema = new mongoose.Schema({
  deviceId: String,

  type: {
    type: String,
  },

  message: String,

  severity: {
    type: String,
  },

  resolved: {
    type: Boolean,
    default: false,
  },

  deviceId: {
    type: String,
    required: true,
  },

  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Alert = mongoose.model("Alert", AlertSchema);
export default Alert;
