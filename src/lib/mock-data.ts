export interface MockUser {
  id: string;
  name: string;
  email: string;
  isPro: boolean;
}

export interface MockItemType {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  count: number;
  isSystem: boolean;
}

export interface MockCollection {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  itemTypeIds: string[];
  isFavorite: boolean;
  accentColor: string;
}

export interface MockItem {
  id: string;
  title: string;
  description: string;
  typeId: string;
  collectionId: string;
  tags: string[];
  isFavorite: boolean;
  isPinned: boolean;
  updatedAt: string;
}

export interface MockDashboardData {
  user: MockUser;
  itemTypes: MockItemType[];
  collections: MockCollection[];
  items: MockItem[];
}

export const mockDashboardData: MockDashboardData = {
  user: {
    id: "user-john-doe",
    name: "John Doe",
    email: "john@example.com",
    isPro: true,
  },
  itemTypes: [
    {
      id: "type-snippet",
      name: "Snippets",
      slug: "snippets",
      icon: "code-2",
      color: "blue",
      count: 24,
      isSystem: true,
    },
    {
      id: "type-prompt",
      name: "Prompts",
      slug: "prompts",
      icon: "sparkles",
      color: "purple",
      count: 18,
      isSystem: true,
    },
    {
      id: "type-command",
      name: "Commands",
      slug: "commands",
      icon: "terminal",
      color: "orange",
      count: 15,
      isSystem: true,
    },
    {
      id: "type-note",
      name: "Notes",
      slug: "notes",
      icon: "notebook-pen",
      color: "yellow",
      count: 12,
      isSystem: true,
    },
    {
      id: "type-file",
      name: "Files",
      slug: "files",
      icon: "file",
      color: "slate",
      count: 5,
      isSystem: true,
    },
    {
      id: "type-image",
      name: "Images",
      slug: "images",
      icon: "image",
      color: "pink",
      count: 3,
      isSystem: true,
    },
    {
      id: "type-link",
      name: "Links",
      slug: "links",
      icon: "link",
      color: "green",
      count: 8,
      isSystem: true,
    },
  ],
  collections: [
    {
      id: "collection-react-patterns",
      name: "React Patterns",
      description: "Common React patterns and hooks",
      itemCount: 12,
      itemTypeIds: ["type-snippet", "type-note", "type-link"],
      isFavorite: true,
      accentColor: "blue",
    },
    {
      id: "collection-python-snippets",
      name: "Python Snippets",
      description: "Useful Python code snippets",
      itemCount: 8,
      itemTypeIds: ["type-snippet", "type-note"],
      isFavorite: false,
      accentColor: "blue",
    },
    {
      id: "collection-context-files",
      name: "Context Files",
      description: "AI context files for projects",
      itemCount: 5,
      itemTypeIds: ["type-file", "type-note"],
      isFavorite: true,
      accentColor: "slate",
    },
    {
      id: "collection-interview-prep",
      name: "Interview Prep",
      description: "Technical interview preparation",
      itemCount: 24,
      itemTypeIds: ["type-note", "type-snippet", "type-link", "type-prompt"],
      isFavorite: false,
      accentColor: "yellow",
    },
    {
      id: "collection-git-commands",
      name: "Git Commands",
      description: "Frequently used git commands",
      itemCount: 15,
      itemTypeIds: ["type-command", "type-note"],
      isFavorite: true,
      accentColor: "orange",
    },
    {
      id: "collection-ai-prompts",
      name: "AI Prompts",
      description: "Curated AI prompts for coding",
      itemCount: 18,
      itemTypeIds: ["type-prompt", "type-link", "type-note"],
      isFavorite: false,
      accentColor: "purple",
    },
  ],
  items: [
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
      tags: ["api", "error-handling", "typescript"],
      isFavorite: false,
      isPinned: true,
      updatedAt: "2026-01-12",
    },
    {
      id: "item-behavioral-questions",
      title: "Behavioral Question Framework",
      description: "STAR answer structure with sample prompts",
      typeId: "type-note",
      collectionId: "collection-interview-prep",
      tags: ["interview", "career"],
      isFavorite: false,
      isPinned: false,
      updatedAt: "2026-01-10",
    },
    {
      id: "item-git-rebase-command",
      title: "Interactive Rebase Commands",
      description: "Quick reference for squash, reword, and fixup flows",
      typeId: "type-command",
      collectionId: "collection-git-commands",
      tags: ["git", "cli"],
      isFavorite: true,
      isPinned: false,
      updatedAt: "2026-01-08",
    },
    {
      id: "item-system-prompt-checklist",
      title: "System Prompt Checklist",
      description: "Prompt template for coding and review tasks",
      typeId: "type-prompt",
      collectionId: "collection-ai-prompts",
      tags: ["ai", "prompts"],
      isFavorite: false,
      isPinned: false,
      updatedAt: "2026-01-05",
    },
    {
      id: "item-project-context-template",
      title: "Project Context Template",
      description: "Starter structure for AI context files",
      typeId: "type-file",
      collectionId: "collection-context-files",
      tags: ["context", "docs"],
      isFavorite: true,
      isPinned: false,
      updatedAt: "2026-01-03",
    },
  ],
};
