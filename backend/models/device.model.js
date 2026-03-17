import mongoose from "mongoose";
const DeviceSchema = new mongoose.Schema(
  {
    deviceType: {
      type: String,
      required: true,
    },

    stationId: {
      type: String,
      required: true,
      ref: "Station",
    },

    name: String,
    location: {
      lat: {
        type: String,
        required: true,
      },
      lng: {
        type: String,
        required: true,
      },
    },
    capacity: Number,

    installedAt: Date,

    averagePowerOutput: {
      type: Number,
      default: 0,
    },
    averageEfficiency: {
      type: Number,
      default: 0,
    }, // percentage

    expectedPowerOutput: {
      type: Number,
      default: 0,
    },

    totalMetricCount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "offline", "maintenance"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

const Device = mongoose.model("Device", DeviceSchema);
export default Device;
