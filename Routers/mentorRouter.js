import express from "express";
import { client } from "../index.js";
import { ObjectId } from "mongodb";

const router = express.Router();

router.route("/mentorstudents/:mentorId").get(async (req, res) => {
  const { mentorId } = req.params;
  //get studentsIds of a mentor
  const { assignedStudents } = await client
    .db("assignmentor")
    .collection("mentors")
    .findOne(
      { _id: ObjectId(mentorId) },
      { projection: { assignedStudents: 1, _id: 0 } }
    );
  //convert ids to object ids
  const studentIdsAsObject = assignedStudents.map((id) => ObjectId(id));
  //Get students details
  const mentorStudents = await client
    .db("assignmentor")
    .collection("students")
    .find({ _id: { $in: studentIdsAsObject } })
    .toArray();

  if (mentorStudents) {
    res.send({ students: mentorStudents });
    return;
  }
  res.sendStatus(400).send({ message: "Error!" });
});

router.route("/addmentor").post(async (req, res) => {
  const mentorDetails = {
    ...req.body,
    assignedStudents: [],
  };
  const insertMentor = await client
    .db("assignmentor")
    .collection("mentors")
    .insertOne(mentorDetails);
  if (insertMentor.acknowledged) {
    res.send({ message: "Mentor details added" });
    return;
  }
  res.status(400).send({ message: "Error!" });
});

router.route("/addstudents").put(async (req, res) => {
  const studentIds = req.body.studentIds;
  //Push studentsIds to assignedStudents of a mentor
  async function updateMentorWithStudents() {
    const updateMentor = await client
      .db("assignmentor")
      .collection("mentors")
      .updateOne(
        { _id: ObjectId(req.body.mentorId) },
        { $push: { assignedStudents: { $each: req.body.studentIds } } }
      );

    return updateMentor.modifiedCount;
  }
  //Update mentorId field of students in studentsIds Array
  const updateStudentsWithMentor = async () => {
    //Write query for multiple students update
    const bulkWriteQuery = studentIds.map((id) => {
      return {
        updateOne: {
          filter: { _id: ObjectId(id) },
          update: { $set: { mentorId: req.body.mentorId } },
        },
      };
    });
    const updateStudents = await client
      .db("assignmentor")
      .collection("students")
      .bulkWrite(bulkWriteQuery);

    return updateStudents.modifiedCount;
  };
  //return students have mentor field
  const studentsHaveMentor = await client
    .db("assignmentor")
    .collection("students")
    .find({ mentorId: { $exists: true } })
    .toArray();
  //Returns studentsIds from request already have mentor
  let requestedStudentsMentorsChecker = studentsHaveMentor
    .filter((student) => studentIds.includes(student._id.toString()))
    .map((student) => student._id);
  //if studentsIds in request already have mentors, execute this
  if (requestedStudentsMentorsChecker.length) {
    res.send({
      studentsHaveMentor: requestedStudentsMentorsChecker,
      message: "Remove students already have mentors from studentIds array",
    });
    return;
  } else {
    const mentorModifiedCount = await updateMentorWithStudents();
    const studentsModifiedCount = await updateStudentsWithMentor();
    if (mentorModifiedCount > 0 && studentsModifiedCount > 0) {
      res.send({ message: "Students and Mentor successfully updated" });
    }
    //res.send({ ms: mentorModifiedCount, ss: studentsModifiedCount });
  }

  // res.status(400).send({ message: "Error!" });
});

export const MentorRouter = router;
