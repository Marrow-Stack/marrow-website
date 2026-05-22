"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";

export function FeedbackVote({ slug }: { slug: string }) {
  const [voted, setVoted] = useState<"up" | "down" | null>(null);

  async function vote(v: "up" | "down") {
    if (voted) return;
    setVoted(v);
    await fetch("/api/feedback/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, vote: v }),
    }).catch(() => {});
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs" style={{ color: "hsl(var(--metal-shine))" }}>
        Was this block useful?
      </span>
      <button
        onClick={() => vote("up")}
        disabled={!!voted}
        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-50"
        style={{
          borderColor: voted === "up" ? "hsl(var(--metal-foreground))" : "hsl(var(--metal-border))",
          color: voted === "up" ? "hsl(var(--metal-foreground))" : "hsl(var(--metal-shine))",
        }}
      >
        <ThumbsUp size={12} />
        Yes
      </button>
      <button
        onClick={() => vote("down")}
        disabled={!!voted}
        className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border transition-all disabled:opacity-50"
        style={{
          borderColor: voted === "down" ? "hsl(var(--metal-foreground))" : "hsl(var(--metal-border))",
          color: voted === "down" ? "hsl(var(--metal-foreground))" : "hsl(var(--metal-shine))",
        }}
      >
        <ThumbsDown size={12} />
        Not really
      </button>
      {voted && (
        <span className="text-xs" style={{ color: "hsl(var(--metal-shine))" }}>
          Thanks for the feedback!
        </span>
      )}
    </div>
  );
}
