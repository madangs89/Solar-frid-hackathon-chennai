import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import { Server } from "socket.io";

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import metricRouter from "./routes/metric.routes.js";
import { connectMongo } from "./config/mongodb.js";
import { connectRedis } from "./config/redis.js";
import authRouter from "./routes/auth.routes.js";
import stationRouter from "./routes/station.routes.js";
import deviceRouter from "./routes/device.routes.js";
import chatRouter from "./routes/chat.routes.js";
import alertRouter from "./routes/alert.routes.js";

const app = express();

const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

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
app.use("/api/station", stationRouter);
app.use("/api/device", deviceRouter);
app.use("/api/ai", chatRouter);
app.use("/api/alerts", alertRouter);

app.get("/", (req, res) => {
  res.send("<h1>hello</h1>");
});

io.on("connection", (socket) => {
  console.log("a user connected");
  console.log("rooms", socket.rooms);

  const userId = socket.handshake.auth.token;
  console.log("userId:", userId, "socketId:", socket.id);

  socket.join(userId);
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

httpServer.listen(process.env.PORT, "0.0.0.0", async () => {
  await connectMongo();
  await connectRedis();
  console.log(
    `server is listening on the port http://localhost:${process.env.PORT}`,
  );
});
