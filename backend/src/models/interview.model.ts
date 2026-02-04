import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInterviewResponse {
  questionId: Types.ObjectId;
  userAnswer: string;
  timeTaken: number; // in seconds
  submittedAt: Date;
  evaluation?: {
    correctnessScore: number;
    problemSolvingScore: number;
    communicationScore: number;
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    improvementSuggestions: string[];
    detailedFeedback: string;
  };
}

export interface IInterview extends Document {
  userId: Types.ObjectId;
  topic: string;
  difficulty: "easy" | "medium" | "hard" | "mixed";
  questionCount: number;
  questions: Types.ObjectId[];
  responses: IInterviewResponse[];
  status: "pending" | "in-progress" | "completed" | "abandoned";
  overallScore?: number;
  performanceSummary?: {
    correctnessAverage: number;
    problemSolvingAverage: number;
    communicationAverage: number;
    topicWiseStrengths: { topic: string; score: number }[];
    topicWiseWeaknesses: { topic: string; score: number }[];
    readinessEstimate: string;
  };
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewResponseSchema: Schema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },
    userAnswer: {
      type: String,
      required: true,
    },
    timeTaken: {
      type: Number,
      required: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    evaluation: {
      correctnessScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      problemSolvingScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      communicationScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      overallScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      improvementSuggestions: [{ type: String }],
      detailedFeedback: {
        type: String,
      },
    },
  },
  { _id: false }
);

const InterviewSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    topic: {
      type: String,
      required: [true, "Topic is required"],
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "mixed"],
      required: [true, "Difficulty level is required"],
    },
    questionCount: {
      type: Number,
      required: [true, "Question count is required"],
      min: [1, "Must have at least 1 question"],
      max: [10, "Cannot exceed 10 questions"],
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    responses: [InterviewResponseSchema],
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "abandoned"],
      default: "pending",
    },
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    performanceSummary: {
      correctnessAverage: { type: Number },
      problemSolvingAverage: { type: Number },
      communicationAverage: { type: Number },
      topicWiseStrengths: [
        {
          topic: String,
          score: Number,
        },
      ],
      topicWiseWeaknesses: [
        {
          topic: String,
          score: Number,
        },
      ],
      readinessEstimate: { type: String },
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
InterviewSchema.index({ userId: 1, status: 1 });
InterviewSchema.index({ userId: 1, createdAt: -1 });
InterviewSchema.index({ status: 1, createdAt: -1 });

// Virtual for completion percentage
InterviewSchema.virtual("completionPercentage").get(function (this: IInterview) {
  if (this.questionCount === 0) return 0;
  return Math.round((this.responses.length / this.questionCount) * 100);
});

const Interview = mongoose.model<IInterview>("Interview", InterviewSchema);

export default Interview;
