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
    required: true,
  },
  numberOfWorkingArray: {
    type: Number,
    required: true,
  },

  numberOfDefectiveArray: {
    type: Number,
  },
  numberOfDustedArray: {
    type: Number,
  },
});

const Station = mongoose.model("Station", stationSchema);

export default Station;
