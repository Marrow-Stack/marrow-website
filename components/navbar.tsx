"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { BookOpen, Boxes, Moon, Search, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Blocks", icon: Boxes, href: "/blocks" },
  { name: "Docs", icon: BookOpen, href: "/docs" },
] as const;

export function RefractiveDock() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setMounted(true);

    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <motion.nav
      initial={{ y: -16, opacity: 0, filter: "blur(10px)" }}
      animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Primary"
      className={cn(
        "fixed left-4 right-4 top-4 z-50 mx-auto flex h-16 max-w-6xl items-center justify-between rounded-2xl border px-4 shadow-sm backdrop-blur-0 sm:left-6 sm:right-6 sm:top-6 sm:px-5",
        "border-gray-300 bg-background/90",
        resolvedTheme === "dark" && "border-gray-600"
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3">
        {NAV_ITEMS.map((item) => (
          <DockIcon
            key={item.name}
            item={item}
            resolvedTheme={resolvedTheme}
          />
        ))}
      </div>

      <div className="flex items-center justify-center px-2">
        {mounted ? (
          <Link
            href="/"
            aria-label="Go to homepage"
            className="inline-flex items-center justify-center transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            <Image
              src={resolvedTheme === "dark" ? "/white.svg" : "/black.svg"}
              alt="MarrowStack"
              width={28}
              height={28}
              priority
            />
          </Link>
        ) : (
          <div className="h-7 w-7 rounded-full bg-foreground/10" />
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative hidden items-center sm:flex">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-subtle" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search"
            className={cn(
              "h-10 w-48 rounded-full pl-10 pr-12 text-sm text-foreground",
              "border placeholder:text-subtle focus:ring-0",
              resolvedTheme === "dark"
                ? "border-gray-600 bg-background/80 focus:border-gray-500"
                : "border-gray-300 bg-background/80 focus:border-gray-400"
            )}
          />
          {!query && (
            <span
              className={cn(
                "pointer-events-none absolute right-3 rounded-md px-1.5 py-0.5 text-[10px] text-subtle",
                "border",
                resolvedTheme === "dark"
                  ? "border-gray-600 bg-background/80"
                  : "border-gray-300 bg-background/80"
              )}
            >
              ⌘K
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-full border bg-background/90",
            resolvedTheme === "dark"
              ? "border-gray-600 hover:bg-foreground/5 active:scale-95"
              : "border-gray-300 hover:bg-foreground/5 active:scale-95"
          )}
        >
          {resolvedTheme === "dark" ? (
            <Sun className="h-4.5 w-4.5" />
          ) : (
            <Moon className="h-4.5 w-4.5" />
          )}
        </button>
      </div>
    </motion.nav>
  );
}

function DockIcon({
  item,
  resolvedTheme,
}: {
  item: (typeof NAV_ITEMS)[number];
  resolvedTheme: string | undefined;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn(
        "group relative inline-flex h-10 w-10 items-center justify-center rounded-full border bg-background/90",
        "hover:bg-foreground/5 active:scale-95",
        resolvedTheme === "dark"
          ? "border-gray-600"
          : "border-gray-300"
      )}
      aria-label={item.name}
    >
      <Icon className="h-4.5 w-4.5 text-subtle transition-colors group-hover:text-foreground" />
      <span
        className={cn(
          "pointer-events-none absolute -bottom-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-1 text-[10px] text-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100",
          "border",
          resolvedTheme === "dark"
            ? "border-gray-600 bg-background"
            : "border-gray-300 bg-background"
        )}
      >
        {item.name}
      </span>
    </Link>
  );
}