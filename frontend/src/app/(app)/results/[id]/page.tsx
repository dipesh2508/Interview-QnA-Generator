"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ProtectedRoute } from "@/components/protected-route";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { ArrowLeft, Download, TrendingUp, TrendingDown, CheckCircle, XCircle, Award } from "lucide-react";

interface Evaluation {
  correctnessScore: number;
  problemSolvingScore: number;
  communicationScore: number;
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
  detailedFeedback: string;
}

interface Response {
  questionId: string;
  userAnswer: string;
  timeTaken: number;
  submittedAt: string;
  evaluation?: Evaluation;
}

interface Question {
  _id: string;
  text: string;
  category: string;
  difficulty: string;
  modelAnswer: string;
}

interface Interview {
  _id: string;
  topic: string;
  difficulty: string;
  questionCount: number;
  questions: Question[];
  responses: Response[];
  overallScore?: number;
  performanceSummary?: {
    correctnessAverage: number;
    problemSolvingAverage: number;
    communicationAverage: number;
    topicWiseStrengths: { topic: string; score: number }[];
    topicWiseWeaknesses: { topic: string; score: number }[];
    readinessEstimate: string;
  };
  status: string;
  completedAt?: string;
}

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchResults();
    }
  }, [id]);

  const fetchResults = async () => {
    try {
      const response: any = await apiClient.getInterview(id);
      setInterview(response.interview);

      // If interview is not completed, complete it first
      if (response.interview.status !== "completed") {
        await apiClient.completeInterview(id, "completed");
        // Refetch to get updated scores
        const updated: any = await apiClient.getInterview(id);
        setInterview(updated.interview);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load results");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await apiClient.exportInterviewPDF(id, {
        includeAnswers: true,
        includeFeedback: true,
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `results-${interview?.topic.replace(/\s+/g, "-")}-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF downloaded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to download PDF");
    } finally {
      setDownloading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getReadinessBadge = (readiness: string) => {
    if (!readiness) return "bg-gray-500/10 text-gray-500 border-gray-500/20";

    if (readiness.includes("Interview Ready") || readiness.includes("Highly Competitive")) {
      return "bg-green-500/10 text-green-500 border-green-500/20";
    }
    if (readiness.includes("Good Progress")) {
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
    if (readiness.includes("Needs Work")) {
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    }
    return "bg-red-500/10 text-red-500 border-red-500/20";
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-linear-to-br from-background to-muted">
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-10 w-40 mb-6" />
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-64" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!interview) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Overall Score Card */}
          <Card className="mb-6 border-primary/50">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <CardTitle className="text-3xl">Interview Results</CardTitle>
                  <CardDescription>{interview.topic}</CardDescription>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{interview.questionCount} Questions</Badge>
                    <Badge variant="outline">{interview.responses.length} Answered</Badge>
                  </div>
                </div>
                <div className="text-center">
                  <div className={`text-6xl font-bold ${getScoreColor(interview.overallScore || 0)}`}>
                    {Math.round(interview.overallScore || 0)}%
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">Overall Score</div>
                  <Button className="mt-4" onClick={handleDownloadPDF} disabled={downloading}>
                    <Download className="h-4 w-4 mr-2" />
                    {downloading ? "Downloading..." : "Download Report"}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Performance Summary */}
          {interview.performanceSummary && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Score Breakdown */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Correctness</span>
                      <span className={getScoreColor(interview.performanceSummary.correctnessAverage || 0)}>
                        {Math.round(interview.performanceSummary.correctnessAverage || 0)}%
                      </span>
                    </div>
                    <Progress value={interview.performanceSummary.correctnessAverage || 0} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Problem Solving</span>
                      <span className={getScoreColor(interview.performanceSummary.problemSolvingAverage || 0)}>
                        {Math.round(interview.performanceSummary.problemSolvingAverage || 0)}%
                      </span>
                    </div>
                    <Progress value={interview.performanceSummary.problemSolvingAverage || 0} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Communication</span>
                      <span className={getScoreColor(interview.performanceSummary.communicationAverage || 0)}>
                        {Math.round(interview.performanceSummary.communicationAverage || 0)}%
                      </span>
                    </div>
                    <Progress value={interview.performanceSummary.communicationAverage || 0} />
                  </div>
                </div>

                {/* Readiness Estimate */}
                {interview.performanceSummary.readinessEstimate && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Readiness Estimate for Google SDE-I</h4>
                    <Badge variant="outline" className={getReadinessBadge(interview.performanceSummary.readinessEstimate)}>
                      {interview.performanceSummary.readinessEstimate.split(".")[0]}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{interview.performanceSummary.readinessEstimate}</p>
                  </div>
                )}

                {/* Strengths */}
                {interview.performanceSummary.topicWiseStrengths && interview.performanceSummary.topicWiseStrengths.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-green-600">
                      <TrendingUp className="h-4 w-4" />
                      Strengths
                    </h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      {interview.performanceSummary.topicWiseStrengths.map((strength, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                          <span className="text-sm font-medium">{strength.topic}</span>
                          <span className="text-sm text-green-600">{Math.round(strength.score)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weaknesses */}
                {interview.performanceSummary.topicWiseWeaknesses && interview.performanceSummary.topicWiseWeaknesses.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2 text-red-600">
                      <TrendingDown className="h-4 w-4" />
                      Areas for Improvement
                    </h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      {interview.performanceSummary.topicWiseWeaknesses.map((weakness, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                          <span className="text-sm font-medium">{weakness.topic}</span>
                          <span className="text-sm text-red-600">{Math.round(weakness.score)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Individual Question Feedback */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Feedback by Question</CardTitle>
              <CardDescription>Review your performance on each question</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {interview.questions.map((question, index) => {
                  const response = interview.responses.find((r) => r.questionId === question._id);
                  const evaluation = response?.evaluation;

                  return (
                    <AccordionItem key={question._id} value={question._id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="font-semibold">Question {index + 1}</span>
                          <div className="flex items-center gap-2">
                            {evaluation ? (
                              <>
                                <span className={`text-lg font-bold ${getScoreColor(evaluation.overallScore)}`}>
                                  {Math.round(evaluation.overallScore)}%
                                </span>
                                {evaluation.overallScore >= 70 ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-500" />
                                )}
                              </>
                            ) : (
                              <Badge variant="secondary">Not Answered</Badge>
                            )}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-4">
                          {/* Question */}
                          <div>
                            <h4 className="font-semibold mb-2">Question:</h4>
                            <p className="text-sm text-muted-foreground">{question.text}</p>
                          </div>

                          {response && (
                            <>
                              {/* User Answer */}
                              <div>
                                <h4 className="font-semibold mb-2">Your Answer:</h4>
                                <div className="bg-muted/50 p-4 rounded-lg">
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{response.userAnswer}</p>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">
                                  Time Taken: {Math.floor(response.timeTaken / 60)} min {response.timeTaken % 60} sec
                                </p>
                              </div>

                              {/* Evaluation */}
                              {evaluation && (
                                <div className="space-y-4 border-t pt-4">
                                  {/* Scores */}
                                  <div className="grid gap-3 md:grid-cols-3">
                                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                                      <div className={`text-2xl font-bold ${getScoreColor(evaluation.correctnessScore)}`}>
                                        {Math.round(evaluation.correctnessScore)}%
                                      </div>
                                      <div className="text-xs text-muted-foreground">Correctness</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                                      <div className={`text-2xl font-bold ${getScoreColor(evaluation.problemSolvingScore)}`}>
                                        {Math.round(evaluation.problemSolvingScore)}%
                                      </div>
                                      <div className="text-xs text-muted-foreground">Problem Solving</div>
                                    </div>
                                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                                      <div className={`text-2xl font-bold ${getScoreColor(evaluation.communicationScore)}`}>
                                        {Math.round(evaluation.communicationScore)}%
                                      </div>
                                      <div className="text-xs text-muted-foreground">Communication</div>
                                    </div>
                                  </div>

                                  {/* Detailed Feedback */}
                                  <div>
                                    <h4 className="font-semibold mb-2">Feedback:</h4>
                                    <p className="text-sm text-muted-foreground">{evaluation.detailedFeedback}</p>
                                  </div>

                                  {/* Strengths */}
                                  {evaluation.strengths.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold mb-2 text-green-600 flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4" />
                                        Strengths:
                                      </h4>
                                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                        {evaluation.strengths.map((strength, i) => (
                                          <li key={i}>{strength}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Improvement Suggestions */}
                                  {evaluation.improvementSuggestions.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold mb-2 text-red-600 flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" />
                                        Improvement Suggestions:
                                      </h4>
                                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                                        {evaluation.improvementSuggestions.map((suggestion, i) => (
                                          <li key={i}>{suggestion}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Model Answer */}
                              <div>
                                <h4 className="font-semibold mb-2">Model Answer:</h4>
                                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{question.modelAnswer}</p>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
