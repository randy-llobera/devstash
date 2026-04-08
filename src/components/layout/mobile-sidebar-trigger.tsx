"use client";

import { Menu } from "lucide-react";

import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export const MobileSidebarTrigger = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label="Open sidebar">
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[300px] p-0 sm:max-w-none"
        showCloseButton={false}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Sidebar navigation</SheetTitle>
          <SheetDescription>Browse item types and collections.</SheetDescription>
        </SheetHeader>
        <Sidebar mobile className="border-r-0" />
      </SheetContent>
    </Sheet>
  );
};
