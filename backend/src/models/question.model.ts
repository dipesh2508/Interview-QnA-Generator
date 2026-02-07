import mongoose, { Schema, Document } from "mongoose";

export interface IQuestion extends Document {
  text: string;
  category: "data-structures" | "algorithms" | "system-design" | "behavioral" | "coding";
  difficulty: "easy" | "medium" | "hard";
  language?: "python" | "cpp" | "java" | "javascript";
  modelAnswer: string;
  timeLimit: number; // in minutes
  timeLimitSeconds: number; // in seconds
  complexityAnalysis?: {
    time: string;
    space: string;
  };
  hints?: string[];
  conceptsTested: string[];
  commonMistakes?: string[];
  interviewerExpectations?: string[];
  followUpQuestions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema: Schema = new Schema(
  {
    text: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["data-structures", "algorithms", "system-design", "behavioral", "coding"],
      required: [true, "Category is required"],
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: [true, "Difficulty level is required"],
    },
    language: {
      type: String,
      enum: ["python", "cpp", "java", "javascript"],
      default: "python",
    },
    modelAnswer: {
      type: String,
      required: [true, "Model answer is required"],
    },
    timeLimit: {
      type: Number,
      required: [true, "Time limit is required"],
      min: [1, "Time limit must be at least 1 minute"],
      max: [60, "Time limit cannot exceed 60 minutes"],
    },
    timeLimitSeconds: {
      type: Number,
      required: true,
    },
    complexityAnalysis: {
      time: { type: String },
      space: { type: String },
    },
    hints: [{ type: String }],
    conceptsTested: {
      type: [String],
      required: [true, "At least one concept must be tested"],
    },
    commonMistakes: [{ type: String }],
    interviewerExpectations: [{ type: String }],
    followUpQuestions: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate timeLimitSeconds
QuestionSchema.pre<IQuestion>("save", function (next) {
  if (this.isModified("timeLimit")) {
    this.timeLimitSeconds = this.timeLimit * 60;
  }
  next();
});

// Index for efficient querying
QuestionSchema.index({ category: 1, difficulty: 1 });

const Question = mongoose.model<IQuestion>("Question", QuestionSchema);

export default Question;
