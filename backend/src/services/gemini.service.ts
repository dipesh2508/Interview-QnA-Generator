import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  SYSTEM_PROMPTS,
  CATEGORY_TEMPLATES,
  EVALUATION_TEMPLATE,
  SESSION_SUMMARY_TEMPLATE,
  FOLLOW_UP_TEMPLATE,
} from "../config/prompts.config";
import Question, { IQuestion } from "../models/question.model";
import { IInterview, IInterviewResponse } from "../models/interview.model";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Use Gemini 1.5 Flash for faster responses and lower cost
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

// Configuration for generation
const generationConfig = {
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 4096,
};

export interface QuestionGenerationParams {
  category: "data-structures" | "algorithms" | "system-design" | "behavioral" | "coding";
  difficulty: "easy" | "medium" | "hard";
  topic: string;
  count?: number;
  language?: "python" | "cpp" | "java" | "javascript";
}

export interface EvaluationParams {
  question: string;
  modelAnswer: string;
  userAnswer: string;
  timeTaken: number;
  timeLimit: number;
}

export interface EvaluationResult {
  correctnessScore: number;
  problemSolvingScore: number;
  communicationScore: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
  detailedFeedback: string;
}

class GeminiService {
  /**
   * Generate interview questions using Gemini AI
   */
  async generateQuestions(params: QuestionGenerationParams): Promise<IQuestion[]> {
    const { category, difficulty, topic, count = 1, language = "python" } = params;

    // Get the appropriate template
    const template = CATEGORY_TEMPLATES[category]?.[difficulty];
    if (!template) {
      throw new Error(`No template found for category: ${category}, difficulty: ${difficulty}`);
    }

    const questions: IQuestion[] = [];

    // Generate each question
    for (let i = 0; i < count; i++) {
      try {
        const prompt = `${SYSTEM_PROMPTS.QUESTION_GENERATOR}\n\n${template.replace("{topic}", topic).replace("{language}", this.getLanguageDisplayName(language))}\n\nIMPORTANT: Respond ONLY with a valid JSON object. Do not include any markdown formatting, explanations, or additional text. The response must be parseable JSON.`;

        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig,
        });

        const response = result.response;
        const text = response.text();

        console.log(`Raw AI response for question ${i + 1}:`, text);

        // Parse JSON response (try to extract JSON from markdown code blocks if present)
        let questionData;
        try {
          // Try direct JSON parse first
          questionData = JSON.parse(text);
        } catch {
          // Extract JSON from markdown code blocks
          const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
            try {
              questionData = JSON.parse(jsonMatch[1]);
            } catch (innerError) {
              console.error("Failed to parse JSON from code block:", innerError);
              // Try to extract partial JSON
              const partialJson = jsonMatch[1].trim();
              if (partialJson.startsWith('{') && partialJson.includes('"text"') && partialJson.includes('"modelAnswer"')) {
                // Try to fix incomplete JSON by adding closing braces
                let fixedJson = partialJson;
                const openBraces = (fixedJson.match(/\{/g) || []).length;
                const closeBraces = (fixedJson.match(/\}/g) || []).length;
                for (let i = 0; i < openBraces - closeBraces; i++) {
                  fixedJson += '}';
                }
                try {
                  questionData = JSON.parse(fixedJson);
                } catch {
                  throw new Error("Could not parse even partial JSON from AI response");
                }
              } else {
                throw new Error("JSON code block found but doesn't contain required fields");
              }
            }
          } else {
            // Try to find JSON object in the text
            const objectMatch = text.match(/\{[\s\S]*\}/);
            if (objectMatch) {
              questionData = JSON.parse(objectMatch[0]);
            } else {
              throw new Error("Could not parse JSON from AI response");
            }
          }
        }

        // Validate and normalize required fields
        let normalizedQuestionData = questionData;

        // Handle nested interview_questions array structure
        if (questionData.interview_questions && Array.isArray(questionData.interview_questions) && questionData.interview_questions.length > 0) {
          // Find the question that matches the requested category
          let selectedQuestion = questionData.interview_questions.find((q: any) =>
            q.category?.toLowerCase().includes(category.toLowerCase().replace('-', ' '))
          );

          // If no exact match, try to find system design related questions
          if (!selectedQuestion && category === 'system-design') {
            selectedQuestion = questionData.interview_questions.find((q: any) =>
              q.category?.toLowerCase().includes('system') ||
              q.category?.toLowerCase().includes('design') ||
              q.question?.toLowerCase().includes('design')
            );
          }

          // If still no match, pick the first question
          if (!selectedQuestion) {
            selectedQuestion = questionData.interview_questions[0];
          }

          const q = selectedQuestion;
          normalizedQuestionData = {
            text: q.question_text || q.question || q.title || q.description || '',
            modelAnswer: q.solution || q.modelAnswer || q.answer || q.example?.explanation || `This is a ${q.level || q.difficulty || difficulty} level question about ${topic}. Please provide a detailed solution.`,
            timeLimit: q.timeLimit || this.getDefaultTimeLimit(difficulty),
            complexityAnalysis: q.complexityAnalysis || {
              time: q.algorithmic_paradigm ? `O(?) - Depends on ${q.algorithmic_paradigm} approach` : "O(n) - Linear time complexity",
              space: "O(1) - Constant space complexity"
            },
            hints: q.hints || q.solution_hints || [`Think about ${category} concepts`, `Consider edge cases`, `Optimize for time/space`],
            conceptsTested: q.tags || q.topic ? [q.topic] : [topic],
            commonMistakes: q.commonMistakes || [`Not handling edge cases`, `Inefficient solution`],
            interviewerExpectations: q.interviewerExpectations || [`Clear explanation`, `Optimal solution`, `Code correctness`],
            followUpQuestions: q.follow_ups || q.follow_up_questions?.map((fq: any) => fq.question || fq) || [`What are the edge cases?`, `Can you optimize this further?`],
            ...questionData // Keep any other fields from the root
          };
        }
        // Handle nested question structure
        else if (questionData.question && typeof questionData.question === 'object') {
          const q = questionData.question;
          normalizedQuestionData = {
            text: q.title ? `${q.title}\n\n${q.description || ''}`.trim() : q.description || '',
            modelAnswer: q.solution || q.example?.explanation || `This is a ${q.difficulty || difficulty} level question about ${topic}. Please provide a detailed solution.`,
            timeLimit: q.timeLimit || this.getDefaultTimeLimit(difficulty),
            complexityAnalysis: q.complexityAnalysis || {
              time: q.algorithmic_paradigm ? `O(?) - Depends on ${q.algorithmic_paradigm} approach` : "O(n) - Linear time complexity",
              space: "O(1) - Constant space complexity"
            },
            hints: q.solution_hints || [`Think about ${category} concepts`, `Consider edge cases`, `Optimize for time/space`],
            conceptsTested: q.tags || [topic],
            commonMistakes: [`Not handling edge cases`, `Inefficient solution`],
            interviewerExpectations: [`Clear explanation`, `Optimal solution`, `Code correctness`],
            followUpQuestions: q.follow_up_questions?.map((fq: any) => fq.question || fq) || [`What are the edge cases?`, `Can you optimize this further?`],
            ...questionData // Keep any other fields from the root
          };
        }

        // Validate required fields
        if (!normalizedQuestionData.text || !normalizedQuestionData.modelAnswer) {
          console.error("Missing required fields in questionData:", questionData);
          console.error("Normalized questionData:", normalizedQuestionData);
          throw new Error("AI response missing required fields: text or modelAnswer");
        }

        // Create Question document
        const question = new Question({
          text: normalizedQuestionData.text || `Question about ${topic} in ${category}`,
          category,
          difficulty,
          language,
          modelAnswer: normalizedQuestionData.modelAnswer || `This is a sample model answer for the ${category} question about ${topic}. Please provide a detailed solution.`,
          timeLimit: normalizedQuestionData.timeLimit || this.getDefaultTimeLimit(difficulty),
          timeLimitSeconds: (normalizedQuestionData.timeLimit || this.getDefaultTimeLimit(difficulty)) * 60,
          complexityAnalysis: normalizedQuestionData.complexityAnalysis || {
            time: "O(n) - Linear time complexity",
            space: "O(1) - Constant space complexity"
          },
          hints: normalizedQuestionData.hints || [`Think about ${category} concepts`, `Consider edge cases`, `Optimize for time/space`],
          conceptsTested: normalizedQuestionData.conceptsTested || [topic],
          commonMistakes: normalizedQuestionData.commonMistakes || [`Not handling edge cases`, `Inefficient solution`],
          interviewerExpectations: normalizedQuestionData.interviewerExpectations || [`Clear explanation`, `Optimal solution`, `Code correctness`],
          followUpQuestions: normalizedQuestionData.followUpQuestions || [`What are the edge cases?`, `Can you optimize this further?`],
        });

        await question.save();
        questions.push(question);
      } catch (error) {
        console.error(`Error generating question ${i + 1}:`, error);
        throw new Error(`Failed to generate question: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    return questions;
  }

  /**
   * Generate a model answer for a question
   */
  async generateModelAnswer(questionText: string, category: string): Promise<string> {
    try {
      const prompt = `${SYSTEM_PROMPTS.QUESTION_GENERATOR}\n\nProvide a detailed, interview-ready model answer for this ${category} question:\n\n${questionText}\n\nInclude step-by-step reasoning, code (if applicable), and complexity analysis.`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });

      return result.response.text();
    } catch (error) {
      console.error("Error generating model answer:", error);
      throw new Error(`Failed to generate model answer: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Evaluate a candidate's response
   */
  async evaluateResponse(params: EvaluationParams): Promise<EvaluationResult> {
    const { question, modelAnswer, userAnswer, timeTaken, timeLimit } = params;

    try {
      const prompt = EVALUATION_TEMPLATE.replace("{question}", question)
        .replace("{modelAnswer}", modelAnswer)
        .replace("{userAnswer}", userAnswer)
        .replace("{timeTaken}", timeTaken.toString())
        .replace("{timeLimit}", (timeLimit * 60).toString());

      const fullPrompt = `${SYSTEM_PROMPTS.EVALUATOR}\n\n${prompt}`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig,
      });

      const text = result.response.text();

      // Parse JSON response
      let evaluation;
      try {
        evaluation = JSON.parse(text);
      } catch {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          evaluation = JSON.parse(jsonMatch[1]);
        } else {
          const objectMatch = text.match(/\{[\s\S]*\}/);
          if (objectMatch) {
            evaluation = JSON.parse(objectMatch[0]);
          } else {
            throw new Error("Could not parse evaluation JSON");
          }
        }
      }

      return {
        correctnessScore: evaluation.correctnessScore,
        problemSolvingScore: evaluation.problemSolvingScore,
        communicationScore: evaluation.communicationScore,
        overallScore: evaluation.overallScore,
        strengths: evaluation.strengths || [],
        weaknesses: evaluation.weaknesses || [],
        improvementSuggestions: evaluation.improvementSuggestions || [],
        detailedFeedback: evaluation.detailedFeedback || "",
      };
    } catch (error) {
      console.error("Error evaluating response:", error);
      throw new Error(`Failed to evaluate response: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Generate a follow-up question based on candidate's answer
   */
  async generateFollowUp(question: string, userAnswer: string, score: number): Promise<string> {
    try {
      const prompt = FOLLOW_UP_TEMPLATE.replace("{question}", question)
        .replace("{userAnswer}", userAnswer)
        .replace("{score}", score.toString());

      const fullPrompt = `${SYSTEM_PROMPTS.FOLLOW_UP_GENERATOR}\n\n${prompt}`;

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
        generationConfig,
      });

      return result.response.text().trim();
    } catch (error) {
      console.error("Error generating follow-up:", error);
      throw new Error(`Failed to generate follow-up: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Generate session summary and performance analysis
   */
  async generateSessionSummary(interview: IInterview, responses: IInterviewResponse[]): Promise<any> {
    try {
      // Calculate category breakdown
      const categoryBreakdown: { [key: string]: number } = {};
      const categoryScores: { [key: string]: number[] } = {};

      // Build question scores summary
      const questionScores = responses
        .map((r, i) => {
          const evaluation = r.evaluation;
          if (!evaluation) return null;

          return `Question ${i + 1}: Correctness=${evaluation.correctnessScore}, ProblemSolving=${evaluation.problemSolvingScore}, Communication=${evaluation.communicationScore}`;
        })
        .filter(Boolean)
        .join("\n");

      const prompt = SESSION_SUMMARY_TEMPLATE.replace("{totalQuestions}", interview.questionCount.toString())
        .replace("{categoryBreakdown}", JSON.stringify(categoryBreakdown))
        .replace("{overallScore}", interview.overallScore?.toString() || "N/A")
        .replace("{questionScores}", questionScores);

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });

      const text = result.response.text();

      // Parse JSON response
      let summary;
      try {
        summary = JSON.parse(text);
      } catch {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          summary = JSON.parse(jsonMatch[1]);
        } else {
          const objectMatch = text.match(/\{[\s\S]*\}/);
          if (objectMatch) {
            summary = JSON.parse(objectMatch[0]);
          } else {
            throw new Error("Could not parse summary JSON");
          }
        }
      }

      return summary;
    } catch (error) {
      console.error("Error generating session summary:", error);
      throw new Error(`Failed to generate session summary: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Get default time limit based on difficulty
   */
  private getDefaultTimeLimit(difficulty: "easy" | "medium" | "hard"): number {
    const limits = {
      easy: 20,
      medium: 30,
      hard: 40,
    };
    return limits[difficulty];
  }

  /**
   * Get display name for programming language
   */
  private getLanguageDisplayName(language: string): string {
    const languageMap: { [key: string]: string } = {
      python: "Python",
      cpp: "C++",
      java: "Java",
      javascript: "JavaScript",
    };
    return languageMap[language] || "Python";
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }
}

export default new GeminiService();
