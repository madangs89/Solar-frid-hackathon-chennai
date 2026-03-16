import mongoose from "mongoose";
const MaintenanceSchema = new mongoose.Schema({
  deviceId: String,

  issue: String,

  actionTaken: String,

  technician: String,

  date: {
    type: Date,
    default: Date.now,
  },
});

const Maintenance = mongoose.model("Maintenance", MaintenanceSchema);
export default Maintenance;
