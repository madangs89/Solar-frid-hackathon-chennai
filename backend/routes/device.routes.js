import express from "express";
import { createDevice, updateStatus } from "../controlers/device.controler.js";

const deviceRouter = express.Router();

deviceRouter.post("/create", createDevice);

deviceRouter.patch("/update-status", updateStatus);

export default deviceRouter;
