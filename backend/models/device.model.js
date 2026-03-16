import mongoose from "mongoose";
const DeviceSchema = new mongoose.Schema({
  deviceId: {
    type: Object.mongoose.Types.ObjectId,
    required: true,
  },

  deviceType: {
    type: String,
    required: true,
  },

  //   need to make user schema and then connect to device schema
  //   connectedUserId: {
  //     type: Object.mongoose.Types.ObjectId,
  //     required: true,
  //   },

  name: String,

  location: String,

  capacity: Number, // max watt output

  installedAt: Date,

  averagePowerOutput: Number,
  averageEfficiency: Number, // percentage

  expectedPowerOutput: Number,

  totalMetricCount: Number,
  status: {
    type: String,
    enum: ["active", "offline", "maintenance"],
    default: "active",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Device = mongoose.model("Device", DeviceSchema);
export default Device;
