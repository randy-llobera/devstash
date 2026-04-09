import {
  Code2,
  File,
  ImageIcon,
  LinkIcon,
  NotebookPen,
  Sparkles,
  Terminal,
  type LucideIcon,
} from "lucide-react";

const ITEM_TYPE_ICON_MAP = {
  "code-2": Code2,
  sparkles: Sparkles,
  terminal: Terminal,
  "notebook-pen": NotebookPen,
  file: File,
  image: ImageIcon,
  link: LinkIcon,
} as const;

const ITEM_TYPE_COLOR_MAP = {
  blue: "text-blue-400",
  slate: "text-slate-400",
  yellow: "text-yellow-300",
  orange: "text-orange-400",
  purple: "text-violet-400",
  pink: "text-pink-400",
  green: "text-emerald-400",
} as const;

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export const getItemTypeIcon = (icon: string): LucideIcon => {
  return ITEM_TYPE_ICON_MAP[icon as keyof typeof ITEM_TYPE_ICON_MAP] ?? File;
};

export const getItemTypeColorClass = (color: string) => {
  return (
    ITEM_TYPE_COLOR_MAP[color as keyof typeof ITEM_TYPE_COLOR_MAP] ??
    "text-muted-foreground"
  );
};

export const formatUpdatedAt = (value: string) => {
  const now = new Date();
  const currentDate = new Date(`${value}T00:00:00`);
  const diffInDays = Math.round(
    (now.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffInDays <= 0) {
    return "Today";
  }

  if (diffInDays === 1) {
    return "Yesterday";
  }

  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  return DATE_FORMATTER.format(currentDate);
};
