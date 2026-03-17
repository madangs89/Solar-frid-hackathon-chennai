import Station from "../models/stations.model.js";

export const createStation = async (req, res) => {
  try {
    const { name, location } = req.body;

    if ((!name, !location)) {
      return res.status().json({
        message: "All fields required",
        success: false,
      });
    }

    const newStation = await Station.create({
      name,
      location,
    });
    return res.status(201).json({
      message: "Station created successfully",
      station: newStation,
    });
  } catch (error) {
    console.log(error);
    
    return res
      .status(500)
      .json({ message: "Error creating station", error, success: false });
  }
};

export const getAllStations = async (req, res) => {
  try {
    const stations = await Station.find();
    return res.status(200).json({
      message: "Stations fetched successfully",
      stations,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error fetching stations",
      error,
      success: false,
    });
  }
};

export const updateNumberOfToatalNumberofArray = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Station id is required",
        success: false,
      });
    }
    const station = await Station.findById(id);

    if (!station) {
      return res.status(404).json({
        message: "Station not found",
        success: false,
      });
    }
    station.totalNumberOfArray += 1;
    await station.save();
    return res.status(200).json({
      message: "Total number of array updated successfully",
      station,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error updating total number of array",
      err,
      success: false,
    });
  }
};

export const updateNumberOfWorkingArray = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Station id is required",
        success: false,
      });
    }
    const station = await Station.findById(id);
    if (!station) {
      return res.status(404).json({
        message: "Station not found",
        success: false,
      });
    }
    station.numberOfWorkingArray += 1;
    station.numberOfDefectiveArray =
      station.totalNumberOfArray - station.numberOfWorkingArray;
    await station.save();
    return res.status(200).json({
      message: "Number of working array updated successfully",
      station,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating number of working array",
      error,
      success: false,
    });
  }
};

export const updateNumberOfDefectiveArray = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Station id is required",
        success: false,
      });
    }
    const station = await Station.findById(id);
    if (!station) {
      return res.status(404).json({
        message: "Station not found",
        success: false,
      });
    }
    station.numberOfDefectiveArray += 1;

    const totalNumberOfArray = station.totalNumberOfArray;

    station.numberOfWorkingArray =
      totalNumberOfArray - station.numberOfDefectiveArray;

    await station.save();
    return res.status(200).json({
      message: "Number of defective array updated successfully",
      station,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating number of defective array",
      error,
      success: false,
    });
  }
};

export const updateNumberOfDustedArray = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        message: "Station id is required",
        success: false,
      });
    }
    const station = await Station.findById(id);
    if (!station) {
      return res.status(404).json({
        message: "Station not found",
        success: false,
      });
    }
    station.numberOfDustedArray += 1;
    await station.save();
    return res.status(200).json({
      message: "Number of dusted array updated successfully",
      station,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating number of dusted array",
      error,
      success: false,
    });
  }
};
