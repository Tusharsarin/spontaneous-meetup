import express from "express";
import { createBroadcast, getBroadcasts, addJoinRequest, updateRequestStatus, addParticipant, leaveBroadcast, deleteBroadcast } from "./models.js";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Broadcast:
 *       type: object
 *       required:
 *         - activity
 *         - location
 *         - dateTime
 *       properties:
 *         id:
 *           type: string
 *           description: Auto-generated unique identifier
 *         activity:
 *           type: string
 *           description: The activity planned for the meetup
 *         location:
 *           type: string
 *           description: Location of the meetup
 *         dateTime:
 *           type: string
 *           format: date-time
 *           description: Date and time of the meetup
 *         maxParticipants:
 *           type: integer
 *           description: Maximum number of participants allowed
 *         status:
 *           type: string
 *           enum: [active, completed, cancelled]
 *           description: Current status of the broadcast
 *     JoinRequest:
 *       type: object
 *       required:
 *         - user
 *       properties:
 *         user:
 *           type: string
 *           description: User ID of the person requesting to join
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected]
 *           description: Status of the join request
 */

/**
 * @swagger
 * /broadcasts:
 *   post:
 *     summary: Create a new broadcast
 *     tags: [Broadcasts]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Broadcast'
 *     responses:
 *       201:
 *         description: Broadcast created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Broadcast'
 *       500:
 *         description: Server error
 */
router.post("/broadcasts", async (req, res) => {
  try {
    const broadcastData = {
      ...req.body,
      createdBy: req.body.userId,
      creatorName: req.body.userName,
      participants: [],
      joinRequests: [],
      createdAt: new Date().toISOString()
    };
    const broadcast = await createBroadcast(broadcastData);
    res.status(201).json(broadcast);
  } catch (error) {
    console.error("Create broadcast error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /broadcasts:
 *   get:
 *     summary: Get all active broadcasts
 *     tags: [Broadcasts]
 *     responses:
 *       200:
 *         description: List of all active broadcasts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Broadcast'
 *       500:
 *         description: Server error
 */
router.get("/broadcasts", async (req, res) => {
  try {
    const broadcasts = await getBroadcasts();
    console.log("Fetched broadcasts:", broadcasts);
    res.json(broadcasts);
  } catch (error) {
    console.error("Error fetching broadcasts:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /broadcasts/{id}/join:
 *   post:
 *     summary: Send a join request for a broadcast
 *     tags: [Broadcasts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Broadcast ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *             properties:
 *               user:
 *                 type: string
 *     responses:
 *       200:
 *         description: Join request sent successfully
 *       404:
 *         description: Broadcast not found
 *       500:
 *         description: Server error
 */
router.post("/broadcasts/:id/join", async (req, res) => {
  try {
    const { userId, userName } = req.body;
    console.log("Join request data:", req.body);

    if (!userId || !userName) {
      return res.status(400).json({ error: "Missing required user data" });
    }

    await addParticipant(req.params.id, { userId, userName });
    res.status(200).json({ message: "Joined broadcast successfully" });
  } catch (error) {
    console.error("Join error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /broadcasts/{id}/request:
 *   put:
 *     summary: Update status of a join request
 *     tags: [Broadcasts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Broadcast ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user
 *               - status
 *             properties:
 *               user:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *     responses:
 *       200:
 *         description: Request status updated successfully
 *       404:
 *         description: Request not found
 *       500:
 *         description: Server error
 */
router.put("/broadcasts/:id/request", async (req, res) => {
  await updateRequestStatus(req.params.id, req.body.user, req.body.status);
  res.json({ message: `Request ${req.body.status}` });
});

/**
 * @swagger
 * /broadcasts/{id}/leave:
 *   post:
 *     summary: Leave a broadcast
 *     tags: [Broadcasts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Broadcast ID
 *     responses:
 *       200:
 *         description: Left broadcast successfully
 *       404:
 *         description: Broadcast not found
 *       500:
 *         description: Server error
 */
router.post("/broadcasts/:id/leave", async (req, res) => {
  try {
    const { userId } = req.body;
    await leaveBroadcast(req.params.id, userId);
    res.status(200).json({ message: "Left broadcast successfully" });
  } catch (error) {
    console.error("Leave broadcast error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /broadcasts/{id}:
 *   delete:
 *     summary: Delete a broadcast
 *     tags: [Broadcasts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Broadcast ID
 *     responses:
 *       200:
 *         description: Broadcast deleted successfully
 *       404:
 *         description: Broadcast not found
 *       500:
 *         description: Server error
 */
router.delete("/broadcasts/:id", async (req, res) => {
  try {
    await deleteBroadcast(req.params.id);
    res.status(200).json({ message: "Broadcast deleted successfully" });
  } catch (error) {
    console.error("Delete broadcast error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
