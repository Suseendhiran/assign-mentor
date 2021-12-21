import express from "express";
import { ObjectId } from "mongodb";
import { client } from "../index.js";

const router = express.Router();

router.route("/addstudent").post(async (req, res) => {
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

router.route("/updatestudent").put(async (req, res) => {
  const studentId = req.body.studentId;
  const mentorId = req.body.mentorId;
  const student = await client
    .db("assignmentor")
    .collection("students")
    .findOne({ _id: ObjectId(studentId) });
  async function updateStudent() {
    return await client
      .db("assignmentor")
      .collection("students")
      .updateOne(
        { _id: ObjectId(studentId) },
        { $set: { mentorId: mentorId } }
      );
  }
  if (student.mentorId) {
    const updateOldMentor = await client
      .db("assignmentor")
      .collection("mentors")
      .updateOne(
        { _id: ObjectId(student.mentorId) },
        { $pull: { assignedStudents: studentId } }
      );
    const updateStudentRes = await updateStudent();
    const updateCurrentMentor = await client
      .db("assignmentor")
      .collection("mentors")
      .updateOne(
        { _id: ObjectId(mentorId) },
        { $push: { assignedStudents: studentId } }
      );

    if (
      updateStudentRes.modifiedCount > 0 &&
      updateOldMentor.modifiedCount > 0 &&
      updateCurrentMentor.modifiedCount
    ) {
      res.send({ message: "Student Successfully updated" });
      return;
    }
    if (
      updateStudentRes.modifiedCount > 0 ||
      (updateOldMentor.modifiedCount > 0 && updateCurrentMentor.modifiedCount)
    ) {
      res.send({ message: "Student Already has same mentor" });
      return;
    }
  } else {
    const updateMentor = await client
      .db("assignmentor")
      .collection("mentors")
      .updateOne(
        { _id: ObjectId(mentorId) },
        { $push: { assignedStudents: studentId } }
      );
    const updateStudentRes = await updateStudent();

    if (updateStudentRes.modifiedCount > 0 && updateMentor.modifiedCount > 0) {
      res.send({ message: "Student Successfully updated" });
    }
  }

  // const updateStudent = await client
  //   .db("assignmentor")
  //   .collection("students")
  //   .updateOne(
  //     { _id: ObjectId(req.body.studentId) },
  //     { $set: { mentorId: req.body.mentorId } }
  //   );

  // if (updateStudent.acknowledged) {
  //   res.send({ message: "Student suceesfully updated" });
  //   return;
  // }
  // res.status(400).send({ message: "Error!" });
});

export const StudentsRouter = router;
