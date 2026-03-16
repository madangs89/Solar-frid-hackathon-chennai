import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import metricRouter from "./routes/metric.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());





app.use("/api/metric" , metricRouter)


app.get("/", (req, res) => {
  res.send("<h1>hello</h1>");
});



app.listen(3000, () => {
  console.log("server is listening on the port 3000");
});
