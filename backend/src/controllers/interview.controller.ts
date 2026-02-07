import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import Interview from "../models/interview.model";
import Question from "../models/question.model";
import MockSession from "../models/mock-session.model";
import geminiService from "../services/gemini.service";

/**
 * Generate a new interview with questions
 */
export const generateInterview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { topic, difficulty, questionCount, categories, language } = req.body;

    // Validate input
    if (!topic || !difficulty || !questionCount) {
      return res.status(400).json({ message: "Topic, difficulty, and question count are required" });
    }

    if (questionCount < 1 || questionCount > 10) {
      return res.status(400).json({ message: "Question count must be between 1 and 10" });
    }

    if (!["easy", "medium", "hard", "mixed"].includes(difficulty)) {
      return res.status(400).json({ message: "Invalid difficulty level" });
    }

    if (!["python", "cpp", "java", "javascript"].includes(language || "python")) {
      return res.status(400).json({ message: "Invalid programming language" });
    }

    // Check if Gemini API is configured
    if (!geminiService.isConfigured()) {
      return res.status(500).json({ message: "AI service is not configured. Please contact administrator." });
    }

    // Create interview document
    const interview = new Interview({
      userId,
      topic,
      difficulty,
      language: language || "python",
      questionCount,
      questions: [],
      responses: [],
      status: "pending",
    });

    await interview.save();

    // Generate questions using hybrid approach
    const questions = [];
    const categoriesToGenerate = categories || ["data-structures", "algorithms", "coding"];
    const questionsPerCategory = Math.ceil(questionCount / categoriesToGenerate.length);

    try {
      for (let i = 0; i < categoriesToGenerate.length && questions.length < questionCount; i++) {
        const category = categoriesToGenerate[i];
        const count = Math.min(questionsPerCategory, questionCount - questions.length);
        
        // Determine difficulty for this question
        let questionDifficulty = difficulty;
        if (difficulty === "mixed") {
          const difficulties = ["easy", "medium", "hard"];
          questionDifficulty = difficulties[i % difficulties.length] as "easy" | "medium" | "hard";
        }

        // Try to find existing questions first (hybrid approach)
        const existingQuestions = await Question.find({
          category,
          difficulty: questionDifficulty,
          language: language || "python",
          conceptsTested: { $in: [topic] },
        })
          .limit(count)
          .lean();

        if (existingQuestions.length >= count) {
          // Use existing questions
          questions.push(...existingQuestions);
        } else {
          // Generate new questions to fill the gap
          const needed = count - existingQuestions.length;
          const generatedQuestions = await geminiService.generateQuestions({
            category: category as any,
            difficulty: questionDifficulty as "easy" | "medium" | "hard",
            topic,
            count: needed,
            language: language || "python",
          });

          questions.push(...existingQuestions, ...generatedQuestions);
        }
      }

      // Update interview with generated questions
      interview.questions = questions.slice(0, questionCount).map((q: any) => q._id);
      await interview.save();

      // Populate questions for response
      await interview.populate("questions");

      res.status(201).json({
        message: "Interview generated successfully",
        interview: {
          id: interview._id,
          topic: interview.topic,
          difficulty: interview.difficulty,
          questionCount: interview.questionCount,
          status: interview.status,
          questions: interview.questions,
          createdAt: interview.createdAt,
        },
      });
    } catch (error) {
      // If question generation fails, delete the interview
      await Interview.findByIdAndDelete(interview._id);
      throw error;
    }
  } catch (error) {
    console.error("Error generating interview:", error);
    res.status(500).json({
      message: "Failed to generate interview",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get all interviews for the authenticated user
 */
export const getInterviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { status, page = 1, limit = 10 } = req.query;

    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const interviews = await Interview.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("questions")
      .lean();

    const total = await Interview.countDocuments(query);

    res.status(200).json({
      interviews,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching interviews:", error);
    res.status(500).json({
      message: "Failed to fetch interviews",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get a specific interview by ID
 */
export const getInterview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const interview = await Interview.findOne({ _id: id, userId }).populate("questions").lean();

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    res.status(200).json({ interview });
  } catch (error) {
    console.error("Error fetching interview:", error);
    res.status(500).json({
      message: "Failed to fetch interview",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Submit an answer for a question in an interview
 */
export const submitAnswer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { questionId, userAnswer, timeTaken } = req.body;

    if (!questionId || !userAnswer || timeTaken === undefined) {
      return res.status(400).json({ message: "Question ID, answer, and time taken are required" });
    }

    const interview = await Interview.findOne({ _id: id, userId });
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    // Check if answer already submitted
    const existingResponse = interview.responses.find((r) => r.questionId.toString() === questionId);
    if (existingResponse) {
      return res.status(400).json({ message: "Answer already submitted for this question" });
    }

    // Get question details
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    // Update interview status
    if (interview.status === "pending") {
      interview.status = "in-progress";
      interview.startedAt = new Date();
    }

    // Evaluate the response using Gemini AI
    const evaluation = await geminiService.evaluateResponse({
      question: question.text,
      modelAnswer: question.modelAnswer,
      userAnswer,
      timeTaken,
      timeLimit: question.timeLimit,
    });

    // Add response to interview
    interview.responses.push({
      questionId: question._id as Types.ObjectId,
      userAnswer,
      timeTaken,
      submittedAt: new Date(),
      evaluation,
    });

    // Check if interview is complete
    if (interview.responses.length === interview.questionCount) {
      interview.status = "completed";
      interview.completedAt = new Date();

      // Calculate overall score
      const totalScore = interview.responses.reduce((sum, r) => sum + (r.evaluation?.overallScore || 0), 0);
      interview.overallScore = totalScore / interview.responses.length;

      // Generate performance summary
      const summary = await geminiService.generateSessionSummary(interview, interview.responses);
      interview.performanceSummary = summary;
    }

    await interview.save();

    res.status(200).json({
      message: "Answer submitted successfully",
      evaluation,
      interview: {
        id: interview._id,
        status: interview.status,
        completionPercentage: Math.round((interview.responses.length / interview.questionCount) * 100),
        overallScore: interview.overallScore,
      },
    });
  } catch (error) {
    console.error("Error submitting answer:", error);
    res.status(500).json({
      message: "Failed to submit answer",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Complete an interview (mark as completed or abandoned)
 */
export const completeInterview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!["completed", "abandoned"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Must be 'completed' or 'abandoned'" });
    }

    const interview = await Interview.findOne({ _id: id, userId });
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    interview.status = status;
    interview.completedAt = new Date();

    if (status === "completed" && interview.responses.length > 0) {
      // Calculate overall score if not already done
      if (!interview.overallScore) {
        const totalScore = interview.responses.reduce((sum, r) => sum + (r.evaluation?.overallScore || 0), 0);
        interview.overallScore = totalScore / interview.responses.length;
      }

      // Generate performance summary if not already done
      if (!interview.performanceSummary) {
        const summary = await geminiService.generateSessionSummary(interview, interview.responses);
        interview.performanceSummary = summary;
      }
    }

    await interview.save();

    res.status(200).json({
      message: `Interview ${status} successfully`,
      interview: {
        id: interview._id,
        status: interview.status,
        overallScore: interview.overallScore,
        performanceSummary: interview.performanceSummary,
        completedAt: interview.completedAt,
      },
    });
  } catch (error) {
    console.error("Error completing interview:", error);
    res.status(500).json({
      message: "Failed to complete interview",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Delete an interview
 */
export const deleteInterview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const interview = await Interview.findOneAndDelete({ _id: id, userId });
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    res.status(200).json({ message: "Interview deleted successfully" });
  } catch (error) {
    console.error("Error deleting interview:", error);
    res.status(500).json({
      message: "Failed to delete interview",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get user statistics
 */
export const getUserStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const totalInterviews = await Interview.countDocuments({ userId });
    const completedInterviews = await Interview.countDocuments({ userId, status: "completed" });
    const inProgressInterviews = await Interview.countDocuments({ userId, status: "in-progress" });

    const completedInterviewsData = await Interview.find({ userId, status: "completed" }).lean();

    let averageScore = 0;
    if (completedInterviewsData.length > 0) {
      const totalScore = completedInterviewsData.reduce((sum, i) => sum + (i.overallScore || 0), 0);
      averageScore = totalScore / completedInterviewsData.length;
    }

    // Get recent interviews
    const recentInterviews = await Interview.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("topic difficulty status overallScore createdAt")
      .lean();

    res.status(200).json({
      stats: {
        totalInterviews,
        completedInterviews,
        inProgressInterviews,
        averageScore: Math.round(averageScore),
      },
      recentInterviews,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({
      message: "Failed to fetch user statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
