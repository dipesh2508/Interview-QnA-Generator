import { Request, Response, NextFunction } from "express";
import Interview from "../models/interview.model";
import Question from "../models/question.model";
import { generateInterviewPDF, pdfToBuffer } from "../utils/pdf.utils";

/**
 * Export interview as PDF
 */
export const exportInterviewPDF = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { includeAnswers = true, includeFeedback = true } = req.query;

    // Get interview with populated questions
    const interview = await Interview.findOne({ _id: id, userId }).populate("questions").lean();

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    const questions = interview.questions as any[];

    // Generate PDF
    const doc = generateInterviewPDF({
      interview: interview as any,
      questions,
      includeAnswers: includeAnswers === "true" || includeAnswers === true,
      includeFeedback: includeFeedback === "true" || includeFeedback === true,
    });

    // Convert to buffer
    const pdfBuffer = await pdfToBuffer(doc);

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="interview-${interview.topic.replace(/\s+/g, "-")}-${interview._id}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error exporting interview PDF:", error);
    res.status(500).json({
      message: "Failed to export interview as PDF",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
