import { Router } from "express";
import {
  generateInterview,
  getInterviews,
  getInterview,
  submitAnswer,
  completeInterview,
  deleteInterview,
  getUserStats,
} from "../controllers/interview.controller";
import { exportInterviewPDF } from "../controllers/export.controller";
import { verifyAuthMiddleware } from "../middleware/auth.middleware";
import { rateLimiterMiddleware } from "../middleware/rate-limiter.middleware";

const router = Router();

// All routes require authentication
router.use(verifyAuthMiddleware);

// Get user statistics
router.get("/stats", getUserStats);

// Generate new interview (with rate limiting)
router.post("/generate", rateLimiterMiddleware, generateInterview);

// Get all interviews
router.get("/", getInterviews);

// Get specific interview
router.get("/:id", getInterview);

// Export interview as PDF
router.get("/:id/export", exportInterviewPDF);

// Submit answer for a question
router.post("/:id/answer", submitAnswer);

// Complete interview
router.patch("/:id/complete", completeInterview);

// Delete interview
router.delete("/:id", deleteInterview);

export default router;
