import express from "express";
import {
  createDevice,
  getAllDevicesOnBasisOfStations,
  updateStatus,
} from "../controlers/device.controler.js";

const deviceRouter = express.Router();

deviceRouter.post("/create", createDevice);
deviceRouter.get("/all/:stationId", getAllDevicesOnBasisOfStations);

deviceRouter.patch("/update-status", updateStatus);

export default deviceRouter;
