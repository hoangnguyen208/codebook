import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockAuth, mockResponsesCreate, mockCheckAIRateLimit } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockResponsesCreate: vi.fn(),
  mockCheckAIRateLimit: vi.fn(),
}));

vi.mock("server-only", () => ({
  default: {},
}));

vi.mock("@/auth", () => ({
  auth: mockAuth,
}));

vi.mock("@/lib/ai", () => ({
  getClient: vi.fn(() => ({
    responses: {
      create: mockResponsesCreate,
    },
  })),
  AI_MODEL: "gpt-5-nano",
}));

vi.mock("@/lib/ai-rate-limit", () => ({
  checkAIRateLimit: mockCheckAIRateLimit,
}));

import { generateAutoTags, generateDescription, explainCode, optimizePrompt } from "@/actions/ai";

describe("generateAutoTags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckAIRateLimit.mockReturnValue({ allowed: true, remaining: 19, resetAt: Date.now() + 3600000 });
  });

  describe("auth", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await generateAutoTags({ title: "Test" });

      expect(result).toEqual({ success: false, error: "Not authenticated" });
    });

    it("returns error when user has no id", async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const result = await generateAutoTags({ title: "Test" });

      expect(result).toEqual({ success: false, error: "Not authenticated" });
    });
  });

  describe("Pro gating", () => {
    it("returns error when user is not Pro", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: false },
      });

      const result = await generateAutoTags({ title: "Test" });

      expect(result).toEqual({ success: false, error: "AI tag suggestions are a Pro feature" });
    });

    it("allows Pro users to proceed past gating", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: JSON.stringify({ tags: ["typescript", "react"] }),
      });

      const result = await generateAutoTags({ title: "Test" });

      expect(result.success).toBe(true);
    });
  });

  describe("validation", () => {
    it("returns error when title is empty", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });

      const result = await generateAutoTags({ title: "" });

      expect(result.success).toBe(false);
    });

    it("returns error when title is only whitespace", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });

      const result = await generateAutoTags({ title: "   " });

      expect(result.success).toBe(false);
    });
  });

  describe("rate limiting", () => {
    it("returns error when rate limit exceeded", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockCheckAIRateLimit.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 300000,
      });

      const result = await generateAutoTags({ title: "Test" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("AI rate limit reached");
      }
    });

    it("allows when rate limit not exceeded", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: JSON.stringify({ tags: ["typescript"] }),
      });

      const result = await generateAutoTags({ title: "Test" });

      expect(result.success).toBe(true);
    });
  });

  describe("content truncation", () => {
    it("truncates content to 2000 characters before API call", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: JSON.stringify({ tags: ["test"] }),
      });

      const longContent = "a".repeat(3000);

      await generateAutoTags({ title: "Test", content: longContent });

      expect(mockResponsesCreate).toHaveBeenCalledTimes(1);
      const callInput = mockResponsesCreate.mock.calls[0][0].input;
      expect(callInput).toContain("Title: Test");
      expect(callInput).toContain("a".repeat(2000));
      expect(callInput).not.toContain("a".repeat(2001));
    });
  });

  describe("AI responses", () => {
    it("returns tags from array format", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: JSON.stringify(["TypeScript", "React", "Hooks"]),
      });

      const result = await generateAutoTags({ title: "useState example" });

      expect(result).toEqual({
        success: true,
        data: ["typescript", "react", "hooks"],
      });
    });

    it("returns tags from object with tags key", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: JSON.stringify({ tags: ["Python", "Django", "ORM"] }),
      });

      const result = await generateAutoTags({ title: "Django model" });

      expect(result).toEqual({
        success: true,
        data: ["python", "django", "orm"],
      });
    });

    it("normalizes tags to lowercase", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: JSON.stringify(["TypeScript", "React", "JSX"]),
      });

      const result = await generateAutoTags({ title: "Component" });

      expect(result).toEqual({
        success: true,
        data: ["typescript", "react", "jsx"],
      });
    });

    it("deduplicates tags", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: JSON.stringify(["react", "React", "REACT"]),
      });

      const result = await generateAutoTags({ title: "Component" });

      expect(result).toEqual({
        success: true,
        data: ["react"],
      });
    });

    it("limits to 5 tags", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: JSON.stringify(["a", "b", "c", "d", "e", "f", "g"]),
      });

      const result = await generateAutoTags({ title: "Many tags" });

      expect(result.success).toBe(true);
      expect(result.success && result.data.length).toBe(5);
    });

    it("returns error on empty AI response", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: "",
      });

      const result = await generateAutoTags({ title: "Test" });

      expect(result).toEqual({ success: false, error: "AI returned an empty response" });
    });

    it("returns error on invalid JSON", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: "not valid json",
      });

      const result = await generateAutoTags({ title: "Test" });

      expect(result).toEqual({ success: false, error: "Failed to parse AI response" });
    });

    it("returns error when parsed result has no valid tags", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: JSON.stringify({ tags: [] }),
      });

      const result = await generateAutoTags({ title: "Test" });

      expect(result).toEqual({ success: false, error: "No valid tags returned by AI" });
    });

    it("returns error on API failure", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockRejectedValue(new Error("Service unavailable"));

      const result = await generateAutoTags({ title: "Test" });

      expect(result).toEqual({ success: false, error: "Service unavailable" });
    });
  });
});

describe("generateDescription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckAIRateLimit.mockReturnValue({ allowed: true, remaining: 19, resetAt: Date.now() + 3600000 });
  });

  describe("auth and Pro gating", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);
      const result = await generateDescription({ title: "Test" });
      expect(result).toEqual({ success: false, error: "Not authenticated" });
    });

    it("returns error when user is not Pro", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: false } });
      const result = await generateDescription({ title: "Test" });
      expect(result).toEqual({ success: false, error: "AI description generation is a Pro feature" });
    });
  });

  describe("validation", () => {
    it("returns error when no info is provided", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
      const result = await generateDescription({});
      expect(result.success).toBe(false);
    });
  });

  describe("rate limiting", () => {
    it("returns error when rate limit exceeded", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
      mockCheckAIRateLimit.mockReturnValue({ allowed: false, remaining: 0, resetAt: Date.now() + 300000 });
      const result = await generateDescription({ title: "Test" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("AI rate limit reached");
      }
    });
  });

  describe("description generation", () => {
    it("returns generated description text", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
      mockResponsesCreate.mockResolvedValue({
        output_text: "A reusable React component for handling user authentication flows.",
      });

      const result = await generateDescription({ title: "AuthComponent", typeName: "snippet" });

      expect(result).toEqual({
        success: true,
        data: "A reusable React component for handling user authentication flows.",
      });
    });

    it("includes all available fields in the prompt", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
      mockResponsesCreate.mockResolvedValue({
        output_text: "Test description.",
      });

      await generateDescription({
        title: "My Item",
        content: "console.log('hello')",
        typeName: "snippet",
        language: "javascript",
        url: "https://example.com",
      });

      const callInput = mockResponsesCreate.mock.calls[0][0].input;
      expect(callInput).toContain("Title: My Item");
      expect(callInput).toContain("Type: snippet");
      expect(callInput).toContain("Language: javascript");
      expect(callInput).toContain("URL: https://example.com");
      expect(callInput).toContain("Content: console.log('hello')");
    });

    it("truncates content to 2000 characters", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
      mockResponsesCreate.mockResolvedValue({ output_text: "Test." });

      const longContent = "x".repeat(3000);
      await generateDescription({ title: "Test", content: longContent });

      const callInput = mockResponsesCreate.mock.calls[0][0].input;
      expect(callInput).toContain("x".repeat(2000));
      expect(callInput).not.toContain("x".repeat(2001));
    });

    it("handles title-only input", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
      mockResponsesCreate.mockResolvedValue({ output_text: "A sample script." });

      const result = await generateDescription({ title: "My Script" });

      expect(result).toEqual({ success: true, data: "A sample script." });
    });

    it("strips surrounding quotes from response", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
      mockResponsesCreate.mockResolvedValue({
        output_text: '"A quoted description."',
      });

      const result = await generateDescription({ title: "Test" });

      expect(result).toEqual({ success: true, data: "A quoted description." });
    });

    it("returns error on empty AI response", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
      mockResponsesCreate.mockResolvedValue({ output_text: "" });

      const result = await generateDescription({ title: "Test" });

      expect(result).toEqual({ success: false, error: "AI returned an empty response" });
    });

    it("returns error on API failure", async () => {
      mockAuth.mockResolvedValue({ user: { id: "user-1", isPro: true } });
      mockResponsesCreate.mockRejectedValue(new Error("Service unavailable"));

      const result = await generateDescription({ title: "Test" });

      expect(result).toEqual({ success: false, error: "Service unavailable" });
    });
  });
});

describe("explainCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckAIRateLimit.mockReturnValue({ allowed: true, remaining: 19, resetAt: Date.now() + 3600000 });
  });

  describe("auth", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await explainCode({ code: "console.log('hello')", typeName: "snippet" });

      expect(result).toEqual({ success: false, error: "Not authenticated" });
    });

    it("returns error when user has no id", async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const result = await explainCode({ code: "console.log('hello')", typeName: "snippet" });

      expect(result).toEqual({ success: false, error: "Not authenticated" });
    });
  });

  describe("Pro gating", () => {
    it("returns error when user is not Pro", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: false },
      });

      const result = await explainCode({ code: "ls -la", typeName: "command" });

      expect(result).toEqual({ success: false, error: "AI code explanation is a Pro feature" });
    });

    it("allows Pro users to proceed", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: "This code logs a message to the console.",
      });

      const result = await explainCode({ code: "console.log('hello')", typeName: "snippet" });

      expect(result.success).toBe(true);
    });
  });

  describe("validation", () => {
    it("returns error when code is empty", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });

      const result = await explainCode({ code: "", typeName: "snippet" });

      expect(result.success).toBe(false);
    });

    it("returns error when code is only whitespace", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });

      const result = await explainCode({ code: "   ", typeName: "snippet" });

      expect(result.success).toBe(false);
    });

    it("returns error when typeName is empty", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });

      const result = await explainCode({ code: "test", typeName: "" });

      expect(result.success).toBe(false);
    });
  });

  describe("rate limiting", () => {
    it("returns error when rate limit exceeded", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockCheckAIRateLimit.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 300000,
      });

      const result = await explainCode({ code: "test", typeName: "snippet" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("AI rate limit reached");
      }
    });
  });

  describe("content truncation", () => {
    it("truncates code to 2000 characters before API call", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: "Explanation text.",
      });

      const longCode = "x".repeat(3000);

      await explainCode({ code: longCode, typeName: "snippet" });

      expect(mockResponsesCreate).toHaveBeenCalledTimes(1);
      const callInput = mockResponsesCreate.mock.calls[0][0].input;
      expect(callInput).toContain("x".repeat(2000));
      expect(callInput).not.toContain("x".repeat(2001));
    });
  });

  describe("explanation generation", () => {
    it("returns generated explanation with code snippet type", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: "This code snippet uses Array.map to transform each element into a new array.",
      });

      const result = await explainCode({
        code: "const doubled = [1,2,3].map(x => x * 2);",
        typeName: "snippet",
        language: "javascript",
      });

      expect(result).toEqual({
        success: true,
        data: "This code snippet uses Array.map to transform each element into a new array.",
      });
    });

    it("returns generated explanation with command type", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: "This terminal command lists all files in the current directory with detailed information.",
      });

      const result = await explainCode({
        code: "ls -la",
        typeName: "command",
      });

      expect(result).toEqual({
        success: true,
        data: "This terminal command lists all files in the current directory with detailed information.",
      });
    });

    it("includes language in the prompt when provided", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: "Python list comprehension explanation.",
      });

      await explainCode({
        code: "[x for x in range(10)]",
        typeName: "snippet",
        language: "python",
      });

      const callInput = mockResponsesCreate.mock.calls[0][0].input;
      expect(callInput).toContain("Language: python");
      expect(callInput).toContain("[x for x in range(10)]");
    });

    it("omits language from prompt when not provided", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: "Explanation without language.",
      });

      await explainCode({
        code: "echo hello",
        typeName: "command",
      });

      const callInput = mockResponsesCreate.mock.calls[0][0].input;
      expect(callInput).not.toContain("Language:");
    });

    it("returns error on empty AI response", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: "",
      });

      const result = await explainCode({ code: "test", typeName: "snippet" });

      expect(result).toEqual({ success: false, error: "AI returned an empty response" });
    });

    it("returns error on API failure", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockRejectedValue(new Error("Service unavailable"));

      const result = await explainCode({ code: "test", typeName: "snippet" });

      expect(result).toEqual({ success: false, error: "Service unavailable" });
    });
  });
});

describe("optimizePrompt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckAIRateLimit.mockReturnValue({ allowed: true, remaining: 19, resetAt: Date.now() + 3600000 });
  });

  describe("auth", () => {
    it("returns error when not authenticated", async () => {
      mockAuth.mockResolvedValue(null);

      const result = await optimizePrompt({ prompt: "Write a blog post" });

      expect(result).toEqual({ success: false, error: "Not authenticated" });
    });

    it("returns error when user has no id", async () => {
      mockAuth.mockResolvedValue({ user: {} });

      const result = await optimizePrompt({ prompt: "Write a blog post" });

      expect(result).toEqual({ success: false, error: "Not authenticated" });
    });
  });

  describe("Pro gating", () => {
    it("returns error when user is not Pro", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: false },
      });

      const result = await optimizePrompt({ prompt: "Write a blog post" });

      expect(result).toEqual({ success: false, error: "AI prompt optimization is a Pro feature" });
    });

    it("allows Pro users to proceed", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: "Write a comprehensive blog post about AI advancements in 2024.",
      });

      const result = await optimizePrompt({ prompt: "Write a blog post" });

      expect(result.success).toBe(true);
    });
  });

  describe("validation", () => {
    it("returns error when prompt is empty", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });

      const result = await optimizePrompt({ prompt: "" });

      expect(result.success).toBe(false);
    });

    it("returns error when prompt is only whitespace", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });

      const result = await optimizePrompt({ prompt: "   " });

      expect(result.success).toBe(false);
    });
  });

  describe("rate limiting", () => {
    it("returns error when rate limit exceeded", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockCheckAIRateLimit.mockReturnValue({
        allowed: false,
        remaining: 0,
        resetAt: Date.now() + 300000,
      });

      const result = await optimizePrompt({ prompt: "test" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("AI rate limit reached");
      }
    });
  });

  describe("content truncation", () => {
    it("truncates prompt to 2000 characters before API call", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: "Optimized prompt text.",
      });

      const longPrompt = "x".repeat(3000);

      await optimizePrompt({ prompt: longPrompt });

      expect(mockResponsesCreate).toHaveBeenCalledTimes(1);
      const callInput = mockResponsesCreate.mock.calls[0][0].input;
      expect(callInput).toContain("x".repeat(2000));
      expect(callInput).not.toContain("x".repeat(2001));
    });
  });

  describe("prompt optimization", () => {
    it("returns optimized prompt text", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: "Write a detailed technical blog post about AI advancements in 2024, covering GPT-5, multimodal models, and their impact on software development. Include code examples and practical applications.",
      });

      const result = await optimizePrompt({
        prompt: "Write a blog post about AI",
      });

      expect(result).toEqual({
        success: true,
        data: "Write a detailed technical blog post about AI advancements in 2024, covering GPT-5, multimodal models, and their impact on software development. Include code examples and practical applications.",
      });
    });

    it("returns error on empty AI response", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockResolvedValue({
        output_text: "",
      });

      const result = await optimizePrompt({ prompt: "test" });

      expect(result).toEqual({ success: false, error: "AI returned an empty response" });
    });

    it("returns error on API failure", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", isPro: true },
      });
      mockResponsesCreate.mockRejectedValue(new Error("Service unavailable"));

      const result = await optimizePrompt({ prompt: "test" });

      expect(result).toEqual({ success: false, error: "Service unavailable" });
    });
  });
});
