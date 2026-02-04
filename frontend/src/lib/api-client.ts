type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
}

interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export interface Interview {
  _id: string;
  topic: string;
  difficulty: string;
  questionCount: number;
  status: "pending" | "in-progress" | "completed" | "abandoned";
  overallScore?: number;
  createdAt: string;
  completedAt?: string;
}

export interface InterviewsResponse {
  interviews: Interview[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api") {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", headers = {}, body, credentials = "include" } = options;

    const config: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      credentials,
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);

      // Handle non-JSON responses (like PDF downloads)
      const contentType = response.headers.get("content-type");
      if (contentType && !contentType.includes("application/json")) {
        if (response.ok) {
          return response as any; // Return the response object for non-JSON responses
        } else {
          throw {
            message: "Failed to download file",
            status: response.status,
          } as ApiError;
        }
      }

      const data = await response.json();

      if (!response.ok) {
        throw {
          message: data.message || "An error occurred",
          status: response.status,
          errors: data.errors,
        } as ApiError;
      }

      return data;
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }

      // Network error or other unexpected error
      throw {
        message: "Network error. Please check your connection and try again.",
        status: 0,
      } as ApiError;
    }
  }

  // Auth endpoints
  async register(email: string, name: string, password: string) {
    return this.request("/auth/register", {
      method: "POST",
      body: { email, name, password },
    });
  }

  async login(email: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: { email, password },
    });
  }

  async logout() {
    return this.request("/auth/logout", {
      method: "POST",
    });
  }

  async getCurrentUser() {
    return this.request("/auth/me");
  }

  // Interview endpoints
  async generateInterview(data: {
    topic: string;
    difficulty: "easy" | "medium" | "hard" | "mixed";
    questionCount: number;
    categories?: string[];
  }) {
    return this.request("/interviews/generate", {
      method: "POST",
      body: data,
    });
  }

  async getInterviews(params?: { status?: string; page?: number; limit?: number }): Promise<InterviewsResponse> {
    const queryString = params ? `?${new URLSearchParams(params as any).toString()}` : "";
    return this.request(`/interviews${queryString}`);
  }

  async getInterview(id: string) {
    return this.request(`/interviews/${id}`);
  }

  async submitAnswer(interviewId: string, data: { questionId: string; userAnswer: string; timeTaken: number }) {
    return this.request(`/interviews/${interviewId}/answer`, {
      method: "POST",
      body: data,
    });
  }

  async completeInterview(interviewId: string, status: "completed" | "abandoned") {
    return this.request(`/interviews/${interviewId}/complete`, {
      method: "PATCH",
      body: { status },
    });
  }

  async deleteInterview(id: string) {
    return this.request(`/interviews/${id}`, {
      method: "DELETE",
    });
  }

  async getUserStats() {
    return this.request("/interviews/stats");
  }

  async exportInterviewPDF(id: string, options?: { includeAnswers?: boolean; includeFeedback?: boolean }) {
    const queryString = options ? `?${new URLSearchParams(options as any).toString()}` : "";
    const response = await this.request<Response>(`/interviews/${id}/export${queryString}`);
    return response;
  }

  // Mock session endpoints
  async startMockSession(interviewId: string) {
    return this.request("/mock-sessions/start", {
      method: "POST",
      body: { interviewId },
    });
  }

  async getMockSession(id: string) {
    return this.request(`/mock-sessions/${id}`);
  }

  async syncTimer(sessionId: string, clientTimeRemaining: number) {
    return this.request(`/mock-sessions/${sessionId}/sync`, {
      method: "POST",
      body: { clientTimeRemaining },
    });
  }

  async submitMockAnswer(sessionId: string, data: { answer: string; timeTaken: number }) {
    return this.request(`/mock-sessions/${sessionId}/answer`, {
      method: "POST",
      body: data,
    });
  }

  async pauseMockSession(id: string) {
    return this.request(`/mock-sessions/${id}/pause`, {
      method: "PATCH",
    });
  }

  async resumeMockSession(id: string) {
    return this.request(`/mock-sessions/${id}/resume`, {
      method: "PATCH",
    });
  }

  async endMockSession(id: string) {
    return this.request(`/mock-sessions/${id}/end`, {
      method: "PATCH",
    });
  }
}

export const apiClient = new ApiClient();
export type { ApiError };
