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

import { generateAutoTags } from "@/actions/ai";

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
      expect(result.error).toContain("AI rate limit reached");
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
