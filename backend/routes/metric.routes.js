import express from "express";
import { addMetric, allLogs } from "../controlers/metric.controler.js";
import { authMiddelware } from "../middelware/authMiddelware.js";

const metricRouter = express.Router();

metricRouter.post("/add-metric", addMetric);
metricRouter.get("/all-logs", authMiddelware, allLogs);

export default metricRouter;
