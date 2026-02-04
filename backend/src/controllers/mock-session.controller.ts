import { Request, Response, NextFunction } from "express";
import MockSession from "../models/mock-session.model";
import Interview from "../models/interview.model";
import Question from "../models/question.model";
import geminiService from "../services/gemini.service";

/**
 * Start a new mock interview session
 */
export const startMockSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { interviewId } = req.body;

    if (!interviewId) {
      return res.status(400).json({ message: "Interview ID is required" });
    }

    // Get the interview
    const interview = await Interview.findOne({ _id: interviewId, userId }).populate("questions");
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (interview.questions.length === 0) {
      return res.status(400).json({ message: "Interview has no questions" });
    }

    // Check for existing active session
    const existingSession = await MockSession.findOne({ userId, status: "active" });
    if (existingSession) {
      return res.status(400).json({
        message: "You already have an active mock session",
        sessionId: existingSession._id,
      });
    }

    // Get first question
    const firstQuestion = interview.questions[0] as any;

    // Create new mock session (expires in 3 hours)
    const session = new MockSession({
      userId,
      interviewId,
      currentQuestionIndex: 0,
      totalQuestions: interview.questions.length,
      startTime: new Date(),
      lastSyncTime: new Date(),
      timeRemaining: firstQuestion.timeLimitSeconds || 1200, // Default 20 minutes
      totalTimeElapsed: 0,
      responses: [],
      status: "active",
      expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now
    });

    await session.save();

    // Update interview status
    if (interview.status === "pending") {
      interview.status = "in-progress";
      interview.startedAt = new Date();
      await interview.save();
    }

    res.status(201).json({
      message: "Mock session started successfully",
      session: {
        id: session._id,
        currentQuestionIndex: session.currentQuestionIndex,
        totalQuestions: session.totalQuestions,
        timeRemaining: session.timeRemaining,
        expiresAt: session.expiresAt,
      },
      currentQuestion: {
        id: firstQuestion._id,
        text: firstQuestion.text,
        category: firstQuestion.category,
        difficulty: firstQuestion.difficulty,
        timeLimit: firstQuestion.timeLimit,
        timeLimitSeconds: firstQuestion.timeLimitSeconds,
        hints: firstQuestion.hints,
        conceptsTested: firstQuestion.conceptsTested,
      },
    });
  } catch (error) {
    console.error("Error starting mock session:", error);
    res.status(500).json({
      message: "Failed to start mock session",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get current mock session state
 */
export const getMockSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const session = await MockSession.findOne({ _id: id, userId }).populate({
      path: "interviewId",
      populate: { path: "questions" },
    });

    if (!session) {
      return res.status(404).json({ message: "Mock session not found" });
    }

    if (session.isExpired()) {
      session.status = "expired";
      await session.save();
      return res.status(410).json({ message: "Mock session has expired" });
    }

    const interview = session.interviewId as any;
    const currentQuestion = interview.questions[session.currentQuestionIndex];

    res.status(200).json({
      session: {
        id: session._id,
        currentQuestionIndex: session.currentQuestionIndex,
        totalQuestions: session.totalQuestions,
        timeRemaining: session.timeRemaining,
        totalTimeElapsed: session.totalTimeElapsed,
        status: session.status,
        progressPercentage: session.getProgressPercentage(),
      },
      currentQuestion: currentQuestion
        ? {
            id: currentQuestion._id,
            text: currentQuestion.text,
            category: currentQuestion.category,
            difficulty: currentQuestion.difficulty,
            timeLimit: currentQuestion.timeLimit,
            timeLimitSeconds: currentQuestion.timeLimitSeconds,
            hints: currentQuestion.hints,
            conceptsTested: currentQuestion.conceptsTested,
          }
        : null,
    });
  } catch (error) {
    console.error("Error fetching mock session:", error);
    res.status(500).json({
      message: "Failed to fetch mock session",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Sync timer with server (periodic sync)
 */
export const syncTimer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { clientTimeRemaining } = req.body;

    if (clientTimeRemaining === undefined) {
      return res.status(400).json({ message: "Client time remaining is required" });
    }

    const session = await MockSession.findOne({ _id: id, userId });
    if (!session) {
      return res.status(404).json({ message: "Mock session not found" });
    }

    if (session.isExpired()) {
      session.status = "expired";
      await session.save();
      return res.status(410).json({ message: "Mock session has expired" });
    }

    // Sync time
    session.syncTime(clientTimeRemaining);
    await session.save();

    res.status(200).json({
      message: "Timer synced successfully",
      serverTimeRemaining: session.timeRemaining,
      totalTimeElapsed: session.totalTimeElapsed,
    });
  } catch (error) {
    console.error("Error syncing timer:", error);
    res.status(500).json({
      message: "Failed to sync timer",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Submit answer in mock session
 */
export const submitMockAnswer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { answer, timeTaken } = req.body;

    if (!answer || timeTaken === undefined) {
      return res.status(400).json({ message: "Answer and time taken are required" });
    }

    const session = await MockSession.findOne({ _id: id, userId }).populate({
      path: "interviewId",
      populate: { path: "questions" },
    });

    if (!session) {
      return res.status(404).json({ message: "Mock session not found" });
    }

    if (session.isExpired()) {
      session.status = "expired";
      await session.save();
      return res.status(410).json({ message: "Mock session has expired" });
    }

    const interview = session.interviewId as any;
    const currentQuestion = interview.questions[session.currentQuestionIndex];

    if (!currentQuestion) {
      return res.status(400).json({ message: "No current question found" });
    }

    // Add response to session
    session.responses.push({
      questionId: currentQuestion._id,
      answer,
      timeTaken,
      submittedAt: new Date(),
    });

    // Move to next question or complete session
    if (session.currentQuestionIndex + 1 < session.totalQuestions) {
      session.currentQuestionIndex += 1;
      const nextQuestion = interview.questions[session.currentQuestionIndex];
      session.timeRemaining = nextQuestion.timeLimitSeconds || 1200;
      session.lastSyncTime = new Date();
      await session.save();

      res.status(200).json({
        message: "Answer submitted successfully",
        nextQuestion: {
          id: nextQuestion._id,
          text: nextQuestion.text,
          category: nextQuestion.category,
          difficulty: nextQuestion.difficulty,
          timeLimit: nextQuestion.timeLimit,
          timeLimitSeconds: nextQuestion.timeLimitSeconds,
          hints: nextQuestion.hints,
          conceptsTested: nextQuestion.conceptsTested,
        },
        session: {
          currentQuestionIndex: session.currentQuestionIndex,
          totalQuestions: session.totalQuestions,
          timeRemaining: session.timeRemaining,
          progressPercentage: session.getProgressPercentage(),
        },
      });
    } else {
      // Session completed - transfer responses to interview
      session.status = "completed";
      await session.save();

      // Transfer responses from mock session to interview
      const interview = session.interviewId as any;
      const responsesToAdd = [];

      for (const sessionResponse of session.responses) {
        // Find the question
        const question = interview.questions.find((q: any) => q._id.toString() === sessionResponse.questionId.toString());
        if (!question) continue;

        // Evaluate the response using Gemini AI
        let evaluation;
        try {
          evaluation = await geminiService.evaluateResponse({
            question: question.text,
            modelAnswer: question.modelAnswer,
            userAnswer: sessionResponse.answer,
            timeTaken: sessionResponse.timeTaken,
            timeLimit: question.timeLimit,
          });
        } catch (error) {
          console.error(`Error evaluating response for question ${sessionResponse.questionId}:`, error);
          // Provide default evaluation if AI fails
          evaluation = {
            correctnessScore: 50,
            problemSolvingScore: 50,
            communicationScore: 50,
            overallScore: 50,
            strengths: ["Response submitted"],
            weaknesses: ["Evaluation failed"],
            improvementSuggestions: ["Please try again"],
            detailedFeedback: "Unable to evaluate response due to technical issues.",
          };
        }

        responsesToAdd.push({
          questionId: sessionResponse.questionId,
          userAnswer: sessionResponse.answer,
          timeTaken: sessionResponse.timeTaken,
          submittedAt: sessionResponse.submittedAt,
          evaluation,
        });
      }

      // Add responses to interview
      interview.responses = responsesToAdd;
      interview.status = "completed";
      interview.completedAt = new Date();

      // Calculate overall score
      if (responsesToAdd.length > 0) {
        const totalScore = responsesToAdd.reduce((sum, r) => sum + (r.evaluation?.overallScore || 0), 0);
        interview.overallScore = totalScore / responsesToAdd.length;

        // Generate performance summary
        let summary;
        try {
          summary = await geminiService.generateSessionSummary(interview, responsesToAdd);
        } catch (error) {
          console.error("Error generating session summary:", error);
          // Provide default summary if AI fails
          summary = {
            correctnessAverage: responsesToAdd.reduce((sum, r) => sum + (r.evaluation?.correctnessScore || 50), 0) / responsesToAdd.length,
            problemSolvingAverage: responsesToAdd.reduce((sum, r) => sum + (r.evaluation?.problemSolvingScore || 50), 0) / responsesToAdd.length,
            communicationAverage: responsesToAdd.reduce((sum, r) => sum + (r.evaluation?.communicationScore || 50), 0) / responsesToAdd.length,
            topicWiseStrengths: [],
            topicWiseWeaknesses: [],
            readinessEstimate: "Evaluation completed with limited AI analysis",
          };
        }
        interview.performanceSummary = summary;
      }

      await interview.save();

      res.status(200).json({
        message: "Mock session completed successfully",
        sessionCompleted: true,
        session: {
          id: session._id,
          interviewId: session.interviewId,
          totalQuestions: session.totalQuestions,
          totalTimeElapsed: session.totalTimeElapsed,
        },
      });
    }
  } catch (error) {
    console.error("Error submitting mock answer:", error);
    res.status(500).json({
      message: "Failed to submit answer",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Pause mock session
 */
export const pauseMockSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const session = await MockSession.findOne({ _id: id, userId });
    if (!session) {
      return res.status(404).json({ message: "Mock session not found" });
    }

    if (session.status !== "active") {
      return res.status(400).json({ message: "Session is not active" });
    }

    session.status = "paused";
    await session.save();

    res.status(200).json({ message: "Mock session paused successfully" });
  } catch (error) {
    console.error("Error pausing mock session:", error);
    res.status(500).json({
      message: "Failed to pause mock session",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Resume mock session
 */
export const resumeMockSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const session = await MockSession.findOne({ _id: id, userId });
    if (!session) {
      return res.status(404).json({ message: "Mock session not found" });
    }

    if (session.status !== "paused") {
      return res.status(400).json({ message: "Session is not paused" });
    }

    if (session.isExpired()) {
      session.status = "expired";
      await session.save();
      return res.status(410).json({ message: "Mock session has expired" });
    }

    session.status = "active";
    session.lastSyncTime = new Date();
    await session.save();

    res.status(200).json({ message: "Mock session resumed successfully" });
  } catch (error) {
    console.error("Error resuming mock session:", error);
    res.status(500).json({
      message: "Failed to resume mock session",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * End mock session (abandon)
 */
export const endMockSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const session = await MockSession.findOne({ _id: id, userId });
    if (!session) {
      return res.status(404).json({ message: "Mock session not found" });
    }

    session.status = "expired";
    await session.save();

    res.status(200).json({ message: "Mock session ended successfully" });
  } catch (error) {
    console.error("Error ending mock session:", error);
    res.status(500).json({
      message: "Failed to end mock session",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
