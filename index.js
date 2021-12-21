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

app.post("/students/addstudents", async (req, res) => {
  const insertStudent = await client
    .db("assignmentor")
    .collection("students")
    .insertOne(req.body);
  if (insertStudent.acknowledged) {
    res.send({ message: "Student details added" });
    return;
  }
  res.status(400).send({ message: "Error!" });
});
app.put("/students/updatestudent", async (req, res) => {
  const updateStudent = await client
    .db("assignmentor")
    .collection("students")
    .updateOne(
      { _id: ObjectId(req.body.studentId) },
      { $set: { mentorId: req.body.mentorId } }
    );

  if (updateStudent.acknowledged) {
    res.send({ message: "Student suceesfully updated" });
    return;
  }
  res.status(400).send({ message: "Error!" });
});
