import mongoose from "mongoose";

const stationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  totalNumberOfArray: {
    type: Number,
    default: 0,
  },
  numberOfWorkingArray: {
    type: Number,
    default: 0,
  },

  numberOfDefectiveArray: {
    type: Number,
    default: 0,
  },
  numberOfDustedArray: {
    type: Number,
    default: 0,
  },
});

const Station = mongoose.model("Station", stationSchema);

export default Station;
