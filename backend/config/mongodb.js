import mongoose from "mongoose";

export const connectMongo = async () => {
  try {
    console.log("Attempting to connect to MongoDB...", process.env.MONGO_URL);

    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.log(error);
  }
};
