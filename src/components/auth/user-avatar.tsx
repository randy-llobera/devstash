"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  name?: string | null;
  image?: string | null;
  fallbackLabel?: string;
  size?: "default" | "sm" | "lg";
}

export const getUserInitials = (name?: string | null) => {
  const parts =
    name
      ?.trim()
      .split(/\s+/)
      .filter(Boolean) ?? [];

  if (parts.length === 0) {
    return "U";
  }

  return parts
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

export const UserAvatar = ({
  name,
  image,
  fallbackLabel = "User",
  size = "default",
}: UserAvatarProps) => {
  const label = name?.trim() || fallbackLabel;

  return (
    <Avatar size={size}>
      {image ? <AvatarImage src={image} alt={`${label} avatar`} /> : null}
      <AvatarFallback>{getUserInitials(name || fallbackLabel)}</AvatarFallback>
    </Avatar>
  );
};
