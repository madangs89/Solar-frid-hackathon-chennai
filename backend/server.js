import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import metricRouter from "./routes/metric.routes.js";
import { connectMongo } from "./config/mongodb.js";
// import { connectRedis } from "./config/redis.js";
import authRouter from "./routes/auth.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/metric", metricRouter);
app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
  res.send("<h1>hello</h1>");
});

app.listen(process.env.PORT, async () => {
  await connectMongo();
  // await connectRedis();
  console.log(
    `server is listening on the port http://localhost:${process.env.PORT}`,
  );
});
