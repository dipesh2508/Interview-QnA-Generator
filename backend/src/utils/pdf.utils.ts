import PDFDocument from "pdfkit";
import { IInterview } from "../models/interview.model";
import { IQuestion } from "../models/question.model";

interface PDFGenerationOptions {
  interview: IInterview;
  questions: IQuestion[];
  includeAnswers?: boolean;
  includeFeedback?: boolean;
}

/**
 * Generate a PDF report for an interview
 */
export const generateInterviewPDF = (options: PDFGenerationOptions): PDFKit.PDFDocument => {
  const { interview, questions, includeAnswers = true, includeFeedback = true } = options;

  // Create a new PDF document
  const doc = new PDFDocument({
    size: "A4",
    margins: {
      top: 50,
      bottom: 50,
      left: 50,
      right: 50,
    },
  });

  // Add header
  doc
    .fontSize(24)
    .font("Helvetica-Bold")
    .fillColor("#047857") // Emerald color
    .text("Google SDE-I Interview Report", { align: "center" })
    .moveDown();

  // Add interview details
  doc
    .fontSize(12)
    .font("Helvetica")
    .fillColor("#000000")
    .text(`Topic: ${interview.topic}`, { continued: false })
    .text(`Difficulty: ${interview.difficulty.toUpperCase()}`)
    .text(`Date: ${interview.createdAt.toLocaleDateString()}`)
    .text(`Status: ${interview.status.toUpperCase()}`)
    .moveDown();

  // Add overall score if available
  if (interview.overallScore) {
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(`Overall Score: ${Math.round(interview.overallScore)}%`)
      .moveDown();
  }

  // Add performance summary if available
  if (includeFeedback && interview.performanceSummary) {
    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Performance Summary")
      .moveDown(0.5);

    doc
      .fontSize(11)
      .font("Helvetica")
      .text(`Correctness Average: ${Math.round(interview.performanceSummary.correctnessAverage)}%`)
      .text(`Problem Solving Average: ${Math.round(interview.performanceSummary.problemSolvingAverage)}%`)
      .text(`Communication Average: ${Math.round(interview.performanceSummary.communicationAverage)}%`)
      .moveDown();

    // Readiness estimate
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("Readiness Estimate:")
      .font("Helvetica")
      .text(interview.performanceSummary.readinessEstimate, { align: "justify" })
      .moveDown();

    // Strengths
    if (interview.performanceSummary.topicWiseStrengths?.length > 0) {
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Strengths:")
        .font("Helvetica");

      interview.performanceSummary.topicWiseStrengths.forEach((strength) => {
        doc.text(`• ${strength.topic}: ${Math.round(strength.score)}%`);
      });
      doc.moveDown();
    }

    // Weaknesses
    if (interview.performanceSummary.topicWiseWeaknesses?.length > 0) {
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Areas for Improvement:")
        .font("Helvetica");

      interview.performanceSummary.topicWiseWeaknesses.forEach((weakness) => {
        doc.text(`• ${weakness.topic}: ${Math.round(weakness.score)}%`);
      });
      doc.moveDown();
    }
  }

  // Add questions and responses
  doc.addPage();
  doc
    .fontSize(18)
    .font("Helvetica-Bold")
    .text("Questions and Responses")
    .moveDown();

  questions.forEach((question, index) => {
    // Check if we need a new page
    if (doc.y > 650) {
      doc.addPage();
    }

    // Question header
    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .fillColor("#047857")
      .text(`Question ${index + 1}`)
      .moveDown(0.3);

    // Question metadata
    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#666666")
      .text(`Category: ${question.category} | Difficulty: ${question.difficulty} | Time Limit: ${question.timeLimit} min`)
      .moveDown(0.5);

    // Question text
    doc
      .fontSize(11)
      .font("Helvetica")
      .fillColor("#000000")
      .text(question.text, { align: "justify" })
      .moveDown();

    // Concepts tested
    if (question.conceptsTested?.length > 0) {
      doc
        .fontSize(10)
        .font("Helvetica-Oblique")
        .fillColor("#666666")
        .text(`Concepts: ${question.conceptsTested.join(", ")}`)
        .moveDown();
    }

    // User's response if available
    const response = interview.responses.find((r) => r.questionId.toString() === (question._id as any).toString());

    if (response) {
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text("Your Answer:")
        .moveDown(0.3);

      doc
        .fontSize(10)
        .font("Helvetica")
        .text(response.userAnswer, { align: "justify" })
        .moveDown(0.5);

      doc
        .fontSize(9)
        .font("Helvetica-Oblique")
        .fillColor("#666666")
        .text(`Time Taken: ${Math.round(response.timeTaken / 60)} minutes`)
        .moveDown();

      // Evaluation scores
      if (includeFeedback && response.evaluation) {
        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .fillColor("#000000")
          .text("Evaluation:")
          .moveDown(0.3);

        doc
          .fontSize(10)
          .font("Helvetica")
          .text(`Correctness: ${response.evaluation.correctnessScore}%`)
          .text(`Problem Solving: ${response.evaluation.problemSolvingScore}%`)
          .text(`Communication: ${response.evaluation.communicationScore}%`)
          .text(`Overall Score: ${response.evaluation.overallScore}%`)
          .moveDown();

        // Detailed feedback
        if (response.evaluation.detailedFeedback) {
          doc
            .fontSize(10)
            .font("Helvetica-Bold")
            .text("Feedback:")
            .moveDown(0.3);

          doc
            .fontSize(9)
            .font("Helvetica")
            .text(response.evaluation.detailedFeedback, { align: "justify" })
            .moveDown();
        }

        // Strengths
        if (response.evaluation.strengths?.length > 0) {
          doc
            .fontSize(10)
            .font("Helvetica-Bold")
            .fillColor("#047857")
            .text("Strengths:")
            .font("Helvetica")
            .fillColor("#000000");

          response.evaluation.strengths.forEach((strength) => {
            doc.fontSize(9).text(`✓ ${strength}`);
          });
          doc.moveDown(0.5);
        }

        // Improvement suggestions
        if (response.evaluation.improvementSuggestions?.length > 0) {
          doc
            .fontSize(10)
            .font("Helvetica-Bold")
            .fillColor("#DC2626")
            .text("Improvement Suggestions:")
            .font("Helvetica")
            .fillColor("#000000");

          response.evaluation.improvementSuggestions.forEach((suggestion) => {
            doc.fontSize(9).text(`→ ${suggestion}`);
          });
          doc.moveDown(0.5);
        }
      }
    } else {
      doc
        .fontSize(10)
        .font("Helvetica-Oblique")
        .fillColor("#999999")
        .text("Not answered yet")
        .moveDown();
    }

    // Model answer if requested
    if (includeAnswers) {
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#000000")
        .text("Model Answer:")
        .moveDown(0.3);

      doc
        .fontSize(9)
        .font("Helvetica")
        .text(question.modelAnswer, { align: "justify" })
        .moveDown();

      // Complexity analysis
      if (question.complexityAnalysis) {
        doc
          .fontSize(9)
          .font("Helvetica-Bold")
          .text(`Time Complexity: ${question.complexityAnalysis.time}`)
          .text(`Space Complexity: ${question.complexityAnalysis.space}`)
          .moveDown();
      }
    }

    // Add separator
    doc
      .strokeColor("#CCCCCC")
      .lineWidth(0.5)
      .moveTo(50, doc.y)
      .lineTo(545, doc.y)
      .stroke()
      .moveDown();
  });

  // Note: Footer generation removed due to page buffering issues
  // TODO: Implement footer after PDFKit buffer issues are resolved

  return doc;
};

/**
 * Helper to convert PDF document to buffer
 */
export const pdfToBuffer = (doc: PDFKit.PDFDocument): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.end();
  });
};
