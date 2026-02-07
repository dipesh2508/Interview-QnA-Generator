"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/protected-route";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";

const CATEGORIES = [
  { id: "data-structures", label: "Data Structures" },
  { id: "algorithms", label: "Algorithms" },
  { id: "system-design", label: "System Design" },
  { id: "behavioral", label: "Behavioral" },
  { id: "coding", label: "Coding" },
];

export default function GeneratePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    topic: "",
    difficulty: "medium" as "easy" | "medium" | "hard" | "mixed",
    language: "python" as "python" | "cpp" | "java" | "javascript",
    questionCount: 5,
    categories: ["data-structures", "algorithms", "coding"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.topic.trim()) {
      setError("Please enter a topic");
      return;
    }

    if (formData.categories.length === 0) {
      setError("Please select at least one category");
      return;
    }

    setLoading(true);

    try {
      const response: any = await apiClient.generateInterview({
        topic: formData.topic,
        difficulty: formData.difficulty,
        language: formData.language,
        questionCount: formData.questionCount,
        categories: formData.categories,
      });

      toast.success("Interview generated successfully!");
      router.push(`/interviews/${response.interview.id}`);
    } catch (err: any) {
      if (err.status === 429) {
        setError(err.message || "Rate limit exceeded. Please try again later.");
      } else {
        setError(err.message || "Failed to generate interview");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter((c) => c !== categoryId)
        : [...prev.categories, categoryId],
    }));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-linear-to-br from-background to-muted">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Generate Interview
              </CardTitle>
              <CardDescription>Create a custom interview with AI-powered questions tailored for Google SDE-I</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Topic */}
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Binary Trees, Dynamic Programming, System Design"
                    value={formData.topic}
                    onChange={(e) => setFormData((prev) => ({ ...prev, topic: e.target.value }))}
                    disabled={loading}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Enter the main topic or area you want to practice</p>
                </div>

                {/* Difficulty */}
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty Level</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value: any) => setFormData((prev) => ({ ...prev, difficulty: value }))}
                    disabled={loading}
                  >
                    <SelectTrigger id="difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Choose the difficulty level or mix of difficulties</p>
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label htmlFor="language">Programming Language</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value: any) => setFormData((prev) => ({ ...prev, language: value }))}
                    disabled={loading}
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Choose the programming language for coding questions</p>
                </div>

                {/* Question Count */}
                <div className="space-y-2">
                  <Label htmlFor="questionCount">Number of Questions</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      id="questionCount"
                      type="range"
                      min="1"
                      max="10"
                      value={formData.questionCount}
                      onChange={(e) => setFormData((prev) => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                      disabled={loading}
                      className="flex-1"
                    />
                    <span className="text-2xl font-bold text-primary w-12 text-center">{formData.questionCount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Select between 1-10 questions for your interview</p>
                </div>

                {/* Categories */}
                <div className="space-y-3">
                  <Label>Question Categories</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {CATEGORIES.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={category.id}
                          checked={formData.categories.includes(category.id)}
                          onCheckedChange={() => handleCategoryToggle(category.id)}
                          disabled={loading}
                        />
                        <Label htmlFor={category.id} className="text-sm font-normal cursor-pointer">
                          {category.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Select at least one category for your questions</p>
                </div>

                {/* Rate Limit Info */}
                <Alert>
                  <AlertDescription className="text-sm">
                    ℹ️ You can generate up to 5 interviews per day. Questions are generated using AI and saved for future
                    use.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={loading} size="lg">
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⚙️</span>
                      Generating Interview...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Interview
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
