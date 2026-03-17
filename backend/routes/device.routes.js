import express from "express";
import {
  createDevice,
  getAllDevicesOnBasisOfStations,
  getDeviceDetailsbyId,
  updateStatus,
} from "../controlers/device.controler.js";
import { authMiddelware } from "../middelware/authMiddelware.js";

const deviceRouter = express.Router();

deviceRouter.get("/all/:stationId", getAllDevicesOnBasisOfStations);

deviceRouter.get("/get/single/:deviceId", authMiddelware, getDeviceDetailsbyId);
deviceRouter.post("/create", createDevice);

deviceRouter.patch("/update-status", updateStatus);

export default deviceRouter;
