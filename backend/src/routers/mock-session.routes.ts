import { Router } from "express";
import {
  startMockSession,
  getMockSession,
  syncTimer,
  submitMockAnswer,
  pauseMockSession,
  resumeMockSession,
  endMockSession,
} from "../controllers/mock-session.controller";
import { verifyAuthMiddleware } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication
router.use(verifyAuthMiddleware);

// Start new mock session
router.post("/start", startMockSession);

// Get mock session state
router.get("/:id", getMockSession);

// Sync timer
router.post("/:id/sync", syncTimer);

// Submit answer
router.post("/:id/answer", submitMockAnswer);

// Pause session
router.patch("/:id/pause", pauseMockSession);

// Resume session
router.patch("/:id/resume", resumeMockSession);

// End session
router.patch("/:id/end", endMockSession);

export default router;
