import express from "express";
import { getAlerts } from "../controlers/alert.contrler.js";

const alertRouter = express.Router();

alertRouter.get("/get-alerts/:deviceId", getAlerts);

export default alertRouter;
