import express from "express";

import { handleFindSession } from "@handler";
import { handleServerError } from "@debug";

const router = express.Router();

// Main Route
router.get("/", async (req, res) => {
  res.status(200).send("Server Side.");
});

// Initial session
// router.get("/api/session", async (req, res) => {
//   try {
//     if (req.headers.authorization) {
//       const sessionId = req.headers.authorization.replace("Bearer ", "");

//       /** @db_call - Find existing session from the database */
//       const session = await handleFindSession(sessionId);

//       // Session found - restore session info
//       if (session) {
//         const data = {
//           sessionId: session._id,
//           user: session.user,
//           room: session.room,
//         };
//         // Send session data back to client
//         res.status(200).json(data);
//       }
//       // Session not found from database - return null
//       else {
//         res.status(200).json(null);
//       }
//     } else {
//       res.status(404).json({ error: "Internal server error" });
//     }
//   } catch (error) {
//     handleServerError(error, "routeHandlers.ts");
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

export default router;
