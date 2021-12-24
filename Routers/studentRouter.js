import express from "express";
import { ObjectId } from "mongodb";
import { client } from "../index.js";

const router = express.Router();

//get all students
router.route("/list").get(async (req, res) => {
  const students = await client
    .db("assignmentor")
    .collection("students")
    .find({}, { projection: { _id: 1, name: 1 } })
    .toArray();

  if (students.length >= 0) {
    res.send(students);
    return;
  }
  res.statusCode(404).send({ message: "Error!" });
});

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
  //get student details
  const student = await client
    .db("assignmentor")
    .collection("students")
    .findOne({ _id: ObjectId(studentId) });
  //update student with mentorid
  async function updateStudent() {
    return await client
      .db("assignmentor")
      .collection("students")
      .updateOne(
        { _id: ObjectId(studentId) },
        { $set: { mentorId: mentorId } }
      );
  }
  //if student already has mentor, remove student from old mentor studentslist and add student to current mentor students list
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
    //if try to same mentor for student, execute this
    if (
      updateStudentRes.modifiedCount > 0 ||
      (updateOldMentor.modifiedCount > 0 && updateCurrentMentor.modifiedCount)
    ) {
      res.send({ message: "Student Already has same mentor" });
      return;
    }
  }
  //if student has no mentor
  else {
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
