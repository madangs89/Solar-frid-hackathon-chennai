import express from "express";
import { addMetric } from "../controlers/metric.controler.js";

const metricRouter = express.Router();

metricRouter.post("/add-metric", addMetric);

export default metricRouter;
