"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { toast } from "sonner";
import { ArrowLeft, Download, Play, Eye, EyeOff } from "lucide-react";
import { SiPython, SiCplusplus, SiOpenjdk, SiJavascript } from "react-icons/si";
import Link from "next/link";
import { CodeBlock } from "@/components/shared/CodeBlock";

interface Question {
  _id: string;
  text: string;
  category: string;
  difficulty: string;
  language?: string;
  modelAnswer: string;
  timeLimit: number;
  complexityAnalysis?: {
    time: string;
    space: string;
  };
  hints?: string[];
  conceptsTested: string[];
}

interface Interview {
  _id: string;
  topic: string;
  difficulty: string;
  language?: string;
  questionCount: number;
  questions: Question[];
  status: string;
  overallScore?: number;
  createdAt: string;
}

export default function InterviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState<{ [key: string]: boolean }>({});
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInterview();
    }
  }, [id]);

  const fetchInterview = async () => {
    try {
      const response: any = await apiClient.getInterview(id);
      setInterview(response.interview);
    } catch (error: any) {
      toast.error(error.message || "Failed to load interview");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleStartMock = async () => {
    try {
      const response: any = await apiClient.startMockSession(id);
      router.push(`/mock/${response.session.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to start mock interview");
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const response = await apiClient.exportInterviewPDF(id, {
        includeAnswers: true,
        includeFeedback: true,
      });

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `interview-${interview?.topic.replace(/\s+/g, "-")}-${id}.pdf`;
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

  const toggleAnswer = (questionId: string) => {
    setShowAnswers((prev) => ({
      ...prev,
      [questionId]: !prev[questionId],
    }));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "hard":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "data-structures":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "algorithms":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "system-design":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "behavioral":
        return "bg-pink-500/10 text-pink-500 border-pink-500/20";
      case "coding":
        return "bg-teal-500/10 text-teal-500 border-teal-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
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
        return <Eye className="h-3 w-3" />;
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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-linear-to-br from-background to-muted">
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-10 w-40 mb-6" />
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-32 w-full" />
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
      <div className="min-h-screen bg-linear-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          {/* Interview Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <CardTitle className="text-3xl">{interview.topic}</CardTitle>
                  <CardDescription>Created on {new Date(interview.createdAt).toLocaleDateString()}</CardDescription>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={getDifficultyColor(interview.difficulty)}>
                      {interview.difficulty}
                    </Badge>
                    {interview.language && (
                      <Badge variant="outline" className={`${getLanguageBadgeColor(interview.language)} flex items-center gap-1`}>
                        {getLanguageIcon(interview.language)}
                        <span>{getLanguageDisplayName(interview.language)}</span>
                      </Badge>
                    )}
                    <Badge variant="outline">{interview.questionCount} Questions</Badge>
                    <Badge variant="outline">{interview.status}</Badge>
                  </div>
                </div>
                {interview.overallScore !== undefined && (
                  <div className="text-right">
                    <div className="text-4xl font-bold text-primary">{Math.round(interview.overallScore)}%</div>
                    <div className="text-sm text-muted-foreground">Overall Score</div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex gap-3">
              <Button onClick={handleStartMock} disabled={interview.status === "completed"}>
                <Play className="h-4 w-4 mr-2" />
                {interview.status === "pending" ? "Start Mock Interview" : "Continue Mock Interview"}
              </Button>
              <Button variant="outline" onClick={handleDownloadPDF} disabled={downloading}>
                <Download className="h-4 w-4 mr-2" />
                {downloading ? "Downloading..." : "Download PDF"}
              </Button>
            </CardContent>
          </Card>

          {/* Questions */}
          <Card>
            <CardHeader>
              <CardTitle>Questions</CardTitle>
              <CardDescription>Review the questions and model answers for this interview</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {interview.questions.map((question, index) => (
                  <AccordionItem key={question._id} value={question._id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-semibold">Question {index + 1}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={getCategoryColor(question.category)}>
                            {question.category.replace("-", " ")}
                          </Badge>
                          <Badge variant="outline" className={getDifficultyColor(question.difficulty)}>
                            {question.difficulty}
                          </Badge>
                          <Badge variant="outline">{question.timeLimit} min</Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        {/* Question Text */}
                        <div>
                          <h4 className="font-semibold mb-2">Problem Statement:</h4>
                          <p className="text-muted-foreground whitespace-pre-wrap">{question.text}</p>
                        </div>

                        {/* Concepts Tested */}
                        {question.conceptsTested && question.conceptsTested.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Concepts Tested:</h4>
                            <div className="flex flex-wrap gap-2">
                              {question.conceptsTested.map((concept, i) => (
                                <Badge key={i} variant="secondary">
                                  {concept}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hints */}
                        {question.hints && question.hints.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Hints:</h4>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                              {question.hints.map((hint, i) => (
                                <li key={i}>{hint}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Model Answer Toggle */}
                        <div className="pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAnswer(question._id)}
                            className="mb-4"
                          >
                            {showAnswers[question._id] ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Hide Model Answer
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Show Model Answer
                              </>
                            )}
                          </Button>

                          {showAnswers[question._id] && (
                            <div className="space-y-4 bg-muted/50 p-4 rounded-lg">
                              <div>
                                <h4 className="font-semibold mb-2">Model Answer:</h4>
                                <CodeBlock content={question.modelAnswer} />
                              </div>

                              {question.complexityAnalysis && (
                                <div>
                                  <h4 className="font-semibold mb-2">Complexity Analysis:</h4>
                                  <div className="space-y-1 text-sm text-muted-foreground">
                                    <p>
                                      <strong>Time Complexity:</strong> {question.complexityAnalysis.time}
                                    </p>
                                    <p>
                                      <strong>Space Complexity:</strong> {question.complexityAnalysis.space}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
