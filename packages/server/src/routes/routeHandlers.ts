import express, { Request, Response } from 'express';

import * as log from '../log';
import { getAvailableThemeLanguages } from '../database/controllers/themeController';

const router = express.Router();

// Main Route
router.get('/', async (_req, res) => {
  const htmlContent = `
    <!doctype html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title></title>
    </head>
    <body>
      <p>Server Side.</p>
    </body>
    </html>
  `;

  res.status(200).send(htmlContent);
});

/**
 * @function getAvailableThemeLanguages
 * @route  GET /api/languages
 * @desc   Get available theme languages
 * @access Public
 */
router.get('/api/languages', async (req: Request, res: Response) => {
  try {
    const languages = await getAvailableThemeLanguages();
    res.status(200).json(languages);
  } catch (error) {
    log.handleServerError(error, 'routeHandlers.ts');
    res.status(500).json({
      error,
      errorMessage: 'Internal server error: Failed to fetch available languages.',
    });
  }
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
//     log.handleServerError(error, "routeHandlers.ts");
//     res.status(500).json({ error: "Internal server error" });
//   }
// });

export default router;
