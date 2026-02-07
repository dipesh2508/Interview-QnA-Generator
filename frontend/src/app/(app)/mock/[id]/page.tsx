"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Clock, AlertTriangle, Send, Pause, Play } from "lucide-react";
import { SiPython, SiCplusplus, SiOpenjdk, SiJavascript } from "react-icons/si";

interface Question {
  id: string;
  text: string;
  category: string;
  difficulty: string;
  language?: string;
  timeLimit: number;
  timeLimitSeconds: number;
  hints?: string[];
  conceptsTested: string[];
}

interface SessionState {
  id: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeRemaining: number;
  progressPercentage: number;
}

export default function MockInterviewPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionState | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHints, setShowHints] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (sessionId) {
      fetchSession();
    }

    return () => {
      // Cleanup timers
      if (timerRef.current) clearInterval(timerRef.current);
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [sessionId]);

  useEffect(() => {
    if (session && !isPaused) {
      startTimer();
      startSyncInterval();
    } else {
      stopTimer();
      stopSyncInterval();
    }

    return () => {
      stopTimer();
      stopSyncInterval();
    };
  }, [session, isPaused]);

  const fetchSession = async () => {
    try {
      const response: any = await apiClient.getMockSession(sessionId);
      setSession(response.session);
      setQuestion(response.currentQuestion);
      setTimeRemaining(response.session.timeRemaining);
      startTimeRef.current = Date.now();
    } catch (error: any) {
      toast.error(error.message || "Failed to load session");
      router.push("/dashboard");
    }
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startSyncInterval = () => {
    stopSyncInterval();
    // Sync with server every 30 seconds
    syncIntervalRef.current = setInterval(() => {
      syncWithServer();
    }, 30000);
  };

  const stopSyncInterval = () => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  };

  const syncWithServer = async () => {
    if (!session || isPaused) return;

    try {
      await apiClient.syncTimer(sessionId, timeRemaining);
    } catch (error) {
      console.error("Failed to sync timer:", error);
    }
  };

  const handleAutoSubmit = async () => {
    toast.warning("Time's up! Auto-submitting your answer...");
    await handleSubmit(true);
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!answer.trim() && !autoSubmit) {
      toast.error("Please provide an answer before submitting");
      return;
    }

    setIsSubmitting(true);
    stopTimer();
    stopSyncInterval();

    const timeTaken = Math.floor((Date.now() - startTimeRef.current) / 1000);

    try {
      const response: any = await apiClient.submitMockAnswer(sessionId, {
        answer: answer.trim() || "No answer provided",
        timeTaken,
      });

      if (response.sessionCompleted) {
        toast.success("Mock interview completed!");
        router.push(`/results/${response.session.interviewId._id}`);
      } else {
        // Move to next question
        setQuestion(response.nextQuestion);
        setSession(response.session);
        setTimeRemaining(response.session.timeRemaining);
        setAnswer("");
        setShowHints(false);
        startTimeRef.current = Date.now();
        toast.success("Answer submitted! Moving to next question...");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit answer");
      startTimer();
      startSyncInterval();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePauseResume = async () => {
    try {
      if (isPaused) {
        await apiClient.resumeMockSession(sessionId);
        setIsPaused(false);
        toast.success("Session resumed");
      } else {
        await apiClient.pauseMockSession(sessionId);
        setIsPaused(true);
        toast.success("Session paused");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to pause/resume session");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeColor = () => {
    if (!question) return "text-foreground";
    const percentage = (timeRemaining / question.timeLimitSeconds) * 100;
    if (percentage <= 25) return "text-red-500";
    if (percentage <= 50) return "text-yellow-500";
    return "text-green-500";
  };

  const getLanguageIcon = (language: string) => {
    switch (language) {
      case "python":
        return <SiPython className="h-3 w-3 text-blue-600" />;
      case "cpp":
        return <SiCplusplus className="h-3 w-3 text-blue-700" />;
      case "java":
        return <SiOpenjdk className="h-3 w-3 text-red-600" />;
      case "javascript":
        return <SiJavascript className="h-3 w-3 text-yellow-600" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getLanguageBadgeColor = (language: string) => {
    switch (language) {
      case "python":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "cpp":
        return "bg-blue-600/10 text-blue-700 border-blue-600/20";
      case "java":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      case "javascript":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      default:
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    }
  };

  const getLanguageDisplayName = (language: string) => {
    switch (language) {
      case "python":
        return "Python";
      case "cpp":
        return "C++";
      case "java":
        return "Java";
      case "javascript":
        return "JavaScript";
      default:
        return "Python";
    }
  };

  if (!session || !question) {
    return (
      <ProtectedRoute>
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin text-4xl">⚙️</div>
        </div>
      </ProtectedRoute>
    );
  }

  const timePercentage = (timeRemaining / question.timeLimitSeconds) * 100;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-linear-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header with Timer */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Mock Interview</CardTitle>
                  <CardDescription>
                    Question {session.currentQuestionIndex + 1} of {session.totalQuestions}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-bold ${getTimeColor()}`}>{formatTime(timeRemaining)}</div>
                  <div className="text-sm text-muted-foreground">Time Remaining</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{session.progressPercentage}%</span>
                </div>
                <Progress value={session.progressPercentage} className="h-2" />
              </div>

              {timePercentage <= 25 && (
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>Less than 25% time remaining!</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Question Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                  {question.category.replace("-", " ")}
                </Badge>
                <div className="flex gap-2">
                  <Badge variant="outline">{question.difficulty}</Badge>
                  {question.language && (
                    <Badge variant="outline" className={`${getLanguageBadgeColor(question.language)} flex items-center gap-1`}>
                      {getLanguageIcon(question.language)}
                      <span>{getLanguageDisplayName(question.language)}</span>
                    </Badge>
                  )}
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {question.timeLimit} min
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-xl">Problem Statement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{question.text}</p>

              {question.conceptsTested && question.conceptsTested.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Concepts:</h4>
                  <div className="flex flex-wrap gap-2">
                    {question.conceptsTested.map((concept, i) => (
                      <Badge key={i} variant="secondary">
                        {concept}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {question.hints && question.hints.length > 0 && (
                <div>
                  <Button variant="ghost" size="sm" onClick={() => setShowHints(!showHints)}>
                    {showHints ? "Hide Hints" : "Show Hints"}
                  </Button>
                  {showHints && (
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-2">
                      {question.hints.map((hint, i) => (
                        <li key={i}>{hint}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Answer Input */}
          <Card>
            <CardHeader>
              <CardTitle>Your Answer</CardTitle>
              <CardDescription>Provide your solution or response to the question above</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Type your answer here... Be detailed and explain your thought process."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={isPaused || isSubmitting}
                className="min-h-75 font-mono"
              />

              <div className="flex gap-3">
                <Button
                  onClick={() => handleSubmit(false)}
                  disabled={isPaused || isSubmitting || !answer.trim()}
                  className="flex-1"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⚙️</span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Answer
                    </>
                  )}
                </Button>

                <Button variant="outline" onClick={handlePauseResume} disabled={isSubmitting}>
                  {isPaused ? (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
