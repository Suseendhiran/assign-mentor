import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import { MentorRouter } from "./Routers/mentorRouter.js";
import { StudentsRouter } from "./Routers/studentRouter.js";
import dotenv from "dotenv";

const app = express();
dotenv.config();

app.listen(process.env.PORT);
app.use(express.json());

const MONGO_URL = process.env.MONGO_URL;

async function createConnection() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  console.log("Mongodb Connected");
  return client;
}
export const client = await createConnection();

app.get("/", (req, res) => {
  res.send("Mentor-student");
});

app.use("/mentors", MentorRouter);
app.use("/students", StudentsRouter);
