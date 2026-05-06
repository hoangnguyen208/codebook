export type MockUser = {
  id: string;
  name: string;
  email: string;
  avatarLabel: string;
  plan: "free" | "pro";
};

export type MockItemType = {
  id: string;
  name: string;
  label: string;
  icon: string;
  color: string;
  isSystem: boolean;
};

export type MockCollection = {
  id: string;
  name: string;
  description: string;
  color: string;
  isFavorite: boolean;
};

export type MockItem = {
  id: string;
  title: string;
  description: string;
  typeId: string;
  collectionId: string;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  updatedAt: string;
};

export const mockDashboardData: {
  user: MockUser;
  itemTypes: MockItemType[];
  collections: MockCollection[];
  items: MockItem[];
} = {
  user: {
    id: "user-john-doe",
    name: "John Doe",
    email: "john@example.com",
    avatarLabel: "JD",
    plan: "pro",
  },
  itemTypes: [
    {
      id: "type-snippet",
      name: "snippet",
      label: "Snippets",
      icon: "code",
      color: "blue",
      isSystem: true,
    },
    {
      id: "type-prompt",
      name: "prompt",
      label: "Prompts",
      icon: "sparkles",
      color: "purple",
      isSystem: true,
    },
    {
      id: "type-command",
      name: "command",
      label: "Commands",
      icon: "terminal",
      color: "orange",
      isSystem: true,
    },
    {
      id: "type-note",
      name: "note",
      label: "Notes",
      icon: "file-text",
      color: "yellow",
      isSystem: true,
    },
    {
      id: "type-file",
      name: "file",
      label: "Files",
      icon: "file",
      color: "slate",
      isSystem: true,
    },
    {
      id: "type-image",
      name: "image",
      label: "Images",
      icon: "image",
      color: "pink",
      isSystem: true,
    },
    {
      id: "type-link",
      name: "link",
      label: "Links",
      icon: "link",
      color: "emerald",
      isSystem: true,
    },
  ],
  collections: [
    {
      id: "collection-react-patterns",
      name: "React Patterns",
      description: "Common React patterns and hooks",
      color: "blue",
      isFavorite: true,
    },
    {
      id: "collection-python-snippets",
      name: "Python Snippets",
      description: "Useful Python code snippets",
      color: "blue",
      isFavorite: false,
    },
    {
      id: "collection-context-files",
      name: "Context Files",
      description: "AI context files for projects",
      color: "slate",
      isFavorite: true,
    },
    {
      id: "collection-interview-prep",
      name: "Interview Prep",
      description: "Technical interview preparation",
      color: "yellow",
      isFavorite: false,
    },
    {
      id: "collection-git-commands",
      name: "Git Commands",
      description: "Frequently used git commands",
      color: "orange",
      isFavorite: true,
    },
    {
      id: "collection-ai-prompts",
      name: "AI Prompts",
      description: "Curated AI prompts for coding",
      color: "purple",
      isFavorite: false,
    },
  ],
  items: [
    {
      id: "item-dashboard-release-checklist",
      title: "Dashboard Release Checklist",
      description: "Final pre-ship checklist for the dashboard rollout and QA pass",
      typeId: "type-note",
      collectionId: "collection-context-files",
      tags: ["release", "dashboard", "checklist"],
      isFavorite: true,
      isPinned: false,
      updatedAt: "2026-01-16",
    },
    {
      id: "item-use-auth-hook",
      title: "useAuth Hook",
      description: "Custom authentication hook for React applications",
      typeId: "type-snippet",
      collectionId: "collection-react-patterns",
      tags: ["react", "auth", "hooks"],
      isFavorite: true,
      isPinned: true,
      updatedAt: "2026-01-15",
    },
    {
      id: "item-api-error-handling",
      title: "API Error Handling Pattern",
      description: "Fetch wrapper with exponential backoff retry logic",
      typeId: "type-snippet",
      collectionId: "collection-react-patterns",
      tags: ["api", "error-handling", "fetch"],
      isFavorite: false,
      isPinned: true,
      updatedAt: "2026-01-12",
    },
    {
      id: "item-python-env-check",
      title: "Python Env Check",
      description: "Small script to confirm the active venv and interpreter",
      typeId: "type-snippet",
      collectionId: "collection-python-snippets",
      tags: ["python", "venv"],
      isFavorite: false,
      isPinned: false,
      updatedAt: "2026-01-10",
    },
    {
      id: "item-pr-review-prompt",
      title: "PR Review Prompt",
      description: "Prompt template for focused code review feedback",
      typeId: "type-prompt",
      collectionId: "collection-ai-prompts",
      tags: ["ai", "review"],
      isFavorite: false,
      isPinned: false,
      updatedAt: "2026-01-09",
    },
    {
      id: "item-rebase-command",
      title: "Interactive Rebase Cheatsheet",
      description: "Common git rebase commands for cleaning commit history",
      typeId: "type-command",
      collectionId: "collection-git-commands",
      tags: ["git", "rebase"],
      isFavorite: true,
      isPinned: false,
      updatedAt: "2026-01-07",
    },
    {
      id: "item-system-design-notes",
      title: "System Design Notes",
      description: "Tradeoffs and reminders for interview architecture questions",
      typeId: "type-note",
      collectionId: "collection-interview-prep",
      tags: ["system-design", "notes"],
      isFavorite: false,
      isPinned: false,
      updatedAt: "2026-01-06",
    },
    {
      id: "item-project-overview",
      title: "Project Overview Template",
      description: "Starter context file for capturing product and technical scope",
      typeId: "type-file",
      collectionId: "collection-context-files",
      tags: ["context", "project"],
      isFavorite: true,
      isPinned: false,
      updatedAt: "2026-01-05",
    },
    {
      id: "item-dashboard-reference",
      title: "Dashboard Reference",
      description: "Screenshot reference for the main developer dashboard layout",
      typeId: "type-image",
      collectionId: "collection-context-files",
      tags: ["ui", "dashboard"],
      isFavorite: false,
      isPinned: false,
      updatedAt: "2026-01-04",
    },
    {
      id: "item-next-app-router-link",
      title: "Next.js App Router Docs",
      description: "Reference link for layouts, pages, and server components",
      typeId: "type-link",
      collectionId: "collection-context-files",
      tags: ["nextjs", "docs"],
      isFavorite: false,
      isPinned: false,
      updatedAt: "2026-01-03",
    },
  ],
};
