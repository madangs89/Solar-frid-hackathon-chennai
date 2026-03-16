import mongoose from "mongoose";

const ReadingSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
  },

  voltage: Number,

  current: Number,

  power: Number,

  expectedPower: Number,

  efficiency: Number,

  temperature: Number,
  irradiance: Number,
  trust_score: Number,

  confidence: Number,

  healthScore: Number,

  battery: Number,

  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Reading = mongoose.model("Reading", ReadingSchema);
export default Reading;
