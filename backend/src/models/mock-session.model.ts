import mongoose, { Schema, Document, Types } from "mongoose";

export interface IMockSession extends Document {
  userId: Types.ObjectId;
  interviewId: Types.ObjectId;
  currentQuestionIndex: number;
  totalQuestions: number;
  startTime: Date;
  lastSyncTime: Date;
  timeRemaining: number; // in seconds for current question
  totalTimeElapsed: number; // in seconds for entire session
  responses: {
    questionId: Types.ObjectId;
    answer: string;
    timeTaken: number;
    submittedAt: Date;
  }[];
  status: "active" | "paused" | "completed" | "expired";
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  // Methods
  isExpired(): boolean;
  getProgressPercentage(): number;
  syncTime(clientTimeRemaining: number): void;
}

const MockSessionSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    interviewId: {
      type: Schema.Types.ObjectId,
      ref: "Interview",
      required: [true, "Interview ID is required"],
      index: true,
    },
    currentQuestionIndex: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
      min: 1,
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastSyncTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    timeRemaining: {
      type: Number,
      required: true,
      min: 0,
    },
    totalTimeElapsed: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    responses: [
      {
        questionId: {
          type: Schema.Types.ObjectId,
          ref: "Question",
          required: true,
        },
        answer: {
          type: String,
          required: true,
        },
        timeTaken: {
          type: Number,
          required: true,
          min: 0,
        },
        submittedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ["active", "paused", "completed", "expired"],
      default: "active",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient session cleanup
MockSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for active session lookup
MockSessionSchema.index({ userId: 1, status: 1 });

// Method to check if session is expired
MockSessionSchema.methods.isExpired = function (): boolean {
  return new Date() > this.expiresAt || this.status === "expired";
};

// Method to calculate progress percentage
MockSessionSchema.methods.getProgressPercentage = function (): number {
  return Math.round((this.currentQuestionIndex / this.totalQuestions) * 100);
};

// Method to sync time
MockSessionSchema.methods.syncTime = function (clientTimeRemaining: number): void {
  const now = new Date();
  const serverElapsed = Math.floor((now.getTime() - this.lastSyncTime.getTime()) / 1000);
  
  // Use client time as source of truth, but validate against server elapsed
  const timeDrift = Math.abs(this.timeRemaining - serverElapsed - clientTimeRemaining);
  
  // If drift is too large (>5 seconds), use server time
  if (timeDrift > 5) {
    this.timeRemaining = Math.max(0, this.timeRemaining - serverElapsed);
  } else {
    this.timeRemaining = Math.max(0, clientTimeRemaining);
  }
  
  this.lastSyncTime = now;
  this.totalTimeElapsed += serverElapsed;
};

const MockSession = mongoose.model<IMockSession>("MockSession", MockSessionSchema);

export default MockSession;
