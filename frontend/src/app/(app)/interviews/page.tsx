"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import type { Interview, InterviewsResponse } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft,
  Play,
  Eye,
  Download,
  Plus,
  Calendar,
  Clock,
  Target,
  Trophy,
  BookOpen,
  Filter
} from "lucide-react";
import { SiPython, SiCplusplus, SiOpenjdk, SiJavascript } from "react-icons/si";
import { ProtectedRoute } from "@/components/protected-route";

export default function InterviewsPage() {
  const router = useRouter();

  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  useEffect(() => {
    fetchInterviews();
  }, [statusFilter, pagination.page]);

  const fetchInterviews = async () => {
    try {
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
      };

      if (statusFilter !== "all") {
        params.status = statusFilter;
      }

      const response: InterviewsResponse = await apiClient.getInterviews(params);
      setInterviews(response.interviews);
      setPagination(response.pagination);
    } catch (error: any) {
      toast.error(error.message || "Failed to load interviews");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStartMockInterview = async (interviewId: string) => {
    try {
      const response: any = await apiClient.startMockSession(interviewId);
      router.push(`/mock/${response.session.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to start mock interview");
    }
  };

  const handleExportPDF = async (interviewId: string) => {
    try {
      const response = await apiClient.exportInterviewPDF(interviewId, {
        includeAnswers: true,
        includeFeedback: true,
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `interview-${interviewId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("PDF downloaded successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to download PDF");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Completed</Badge>;
      case "in-progress":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">In Progress</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>;
      case "abandoned":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Abandoned</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-green-500";
      case "medium":
        return "text-yellow-500";
      case "hard":
        return "text-red-500";
      case "mixed":
        return "text-purple-500";
      default:
        return "text-gray-500";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
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
        return <BookOpen className="h-3 w-3" />;
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
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-linear-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold">My Interviews</h1>
                <p className="text-muted-foreground">View and manage all your interview sessions</p>
              </div>
            </div>
            <Link href="/generate">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate New Interview
              </Button>
            </Link>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by status:</span>
            </div>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Interviews</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="abandoned">Abandoned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Interviews Grid */}
          {interviews.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No interviews found</h3>
                <p className="text-muted-foreground mb-4">
                  {statusFilter === "all"
                    ? "You haven't generated any interviews yet."
                    : `No interviews with status "${statusFilter}".`
                  }
                </p>
                <Link href="/generate">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate Your First Interview
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {interviews.map((interview) => (
                  <Card key={interview._id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg line-clamp-2">{interview.topic}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            {formatDate(interview.createdAt)}
                          </CardDescription>
                        </div>
                        {getStatusBadge(interview.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Interview Stats */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Target className={`h-4 w-4 ${getDifficultyColor(interview.difficulty)}`} />
                          <span className="capitalize">{interview.difficulty}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span>{interview.questionCount} questions</span>
                        </div>
                        {interview.language && (
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`text-xs px-2 py-1 ${getLanguageBadgeColor(interview.language)} font-mono font-semibold flex items-center gap-1`}>
                              {getLanguageIcon(interview.language)}
                              <span>{getLanguageDisplayName(interview.language)}</span>
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Score Display */}
                      {interview.overallScore !== undefined && (
                        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                          <Trophy className="h-4 w-4 text-primary" />
                          <div>
                            <div className="text-lg font-bold text-primary">
                              {Math.round(interview.overallScore)}%
                            </div>
                            <div className="text-xs text-muted-foreground">Overall Score</div>
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        <Link href={`/interviews/${interview._id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>

                        {interview.status === "completed" && (
                          <>
                            <Link href={`/results/${interview._id}`}>
                              <Button variant="outline" size="sm" className="w-full">
                                <Trophy className="h-4 w-4 mr-2" />
                                View Results
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => handleExportPDF(interview._id)}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Export PDF
                            </Button>
                          </>
                        )}

                        {(interview.status === "pending" || interview.status === "completed") && (
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => handleStartMockInterview(interview._id)}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start Mock Interview
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.totalPages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}