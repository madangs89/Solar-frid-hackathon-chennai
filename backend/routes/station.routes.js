import express from "express";
import {
  createStation,
  getAllStations,
  updateNumberOfDefectiveArray,
  updateNumberOfDustedArray,
  updateNumberOfToatalNumberofArray,
  updateNumberOfWorkingArray,
} from "../controlers/stations.controler.js";

const stationRouter = express.Router();

stationRouter.post("/create", createStation);
stationRouter.get("/get-all", getAllStations);
stationRouter.patch("/update-total/:id", updateNumberOfToatalNumberofArray);
stationRouter.patch("/working-total/:id", updateNumberOfWorkingArray);
stationRouter.patch("/defective-total/:id", updateNumberOfDefectiveArray);
stationRouter.patch("/update-dust/:id", updateNumberOfDustedArray);

export default stationRouter;
