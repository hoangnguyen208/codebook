"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronUp, FolderOpen, Menu, Plus, Search, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/auth/UserAvatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DashboardHeaderProps = {
  isDesktopSidebarExpanded: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
  onSearchOpen: () => void;
  pathname: string;
  hasFavoriteContent: boolean;
  isPro: boolean;
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  onCreateCollection: () => void;
  onCreateItem: () => void;
};

export function DashboardHeader({
  isDesktopSidebarExpanded,
  onToggleSidebar,
  onOpenMobileSidebar,
  onSearchOpen,
  pathname,
  hasFavoriteContent,
  isPro,
  user,
  onCreateCollection,
  onCreateItem,
}: DashboardHeaderProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!profileMenuRef.current?.contains(target)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isProfileMenuOpen]);

  return (
    <header className="border-b border-border/60 bg-background/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Button
          variant="outline"
          size="icon-lg"
          className="h-11 w-11 rounded-2xl lg:hidden"
          onClick={onOpenMobileSidebar}
          aria-label="Open sidebar drawer"
        >
          <Menu className="size-5" />
        </Button>

        <Button
          variant="outline"
          size="icon-lg"
          className="hidden h-11 w-11 rounded-2xl lg:inline-flex"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="size-5" />
        </Button>

        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground hidden sm:block" />
          <Input
            aria-label="Search items"
            placeholder="Search items..."
            className="hidden sm:block h-11 rounded-2xl border-border/70 bg-card pl-10 pr-16 shadow-none cursor-pointer"
            readOnly
            onClick={onSearchOpen}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSearchOpen();
              }
            }}
            tabIndex={0}
          />
          <Button
            variant="outline"
            size="icon-lg"
            className="h-11 w-11 rounded-2xl sm:hidden"
            onClick={onSearchOpen}
            aria-label="Search items"
          >
            <Search className="size-5" />
          </Button>
          <span className="pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 rounded-md border border-border/70 px-2 py-1 text-xs font-medium text-muted-foreground sm:inline-flex">
            Ctrl K
          </span>
        </div>

        <Link
          href="/favorites"
          className={cn(
            "h-11 rounded-2xl border inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 text-sm transition-colors shrink-0",
            pathname === "/favorites"
              ? "border-sidebar-ring/60 bg-sidebar-accent text-sidebar-accent-foreground"
              : "border-border/70 bg-card hover:bg-accent",
          )}
        >
          <Star className={cn(
            "size-4",
            hasFavoriteContent
              ? "fill-yellow-400 text-yellow-400"
              : ""
          )} />
          <span className="hidden sm:inline">Favorites</span>
        </Link>

        {!isPro ? (
          <Link
            href="/upgrade"
            className={cn(
              "h-11 rounded-2xl inline-flex items-center gap-1.5 px-2 sm:px-3 text-sm transition-colors shrink-0",
              pathname === "/upgrade"
                ? "border-sidebar-ring/60 bg-sidebar-accent text-sidebar-accent-foreground border"
                : "text-muted-foreground hover:text-foreground hover:bg-accent",
            )}
          >
            <Sparkles className="size-4" />
            <span className="hidden sm:inline">Upgrade</span>
          </Link>
        ) : null}

        <Button size="lg" className="h-11 rounded-2xl px-2 sm:px-4" onClick={onCreateCollection}>
          <FolderOpen className="size-4" />
          <span className="hidden sm:inline">New Collection</span>
        </Button>

        <Button size="lg" className="h-11 rounded-2xl px-2 sm:px-4" onClick={onCreateItem}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">New Item</span>
        </Button>

        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            className="flex h-11 cursor-pointer items-center gap-2 rounded-2xl border border-border/70 bg-card px-3 text-sm hover:bg-accent"
            onClick={() => setIsProfileMenuOpen((open) => !open)}
            aria-label="Open profile menu"
            aria-expanded={isProfileMenuOpen}
          >
            <UserAvatar
              nameOrEmail={user.name || user.email}
              imageUrl={user.image}
              className="size-7"
              textClassName="text-xs"
            />
            <span className="hidden max-w-32 truncate sm:inline">{user.name}</span>
            <ChevronUp
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                isProfileMenuOpen ? "rotate-180" : "",
              )}
            />
          </button>
          {isProfileMenuOpen ? (
            <div className="absolute top-full right-0 z-10 mt-2 min-w-40 rounded-xl border border-border/70 bg-popover p-1 shadow-lg">
              <Link
                href="/settings"
                className="block rounded-lg px-3 py-2 text-sm hover:bg-accent"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                Settings
              </Link>
              <Link
                href="/api/auth/signout-all"
                className="block rounded-lg px-3 py-2 text-sm text-destructive hover:bg-accent"
                onClick={() => setIsProfileMenuOpen(false)}
              >
                Sign out
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
