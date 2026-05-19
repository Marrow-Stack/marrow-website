"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";

type TokenType = "keyword" | "string" | "comment" | "type" | "number" | "operator" | "plain";

interface Token {
  type: TokenType;
  value: string;
}

const KEYWORDS = new Set([
  "export", "import", "from", "as", "async", "function", "const", "let", "var",
  "type", "interface", "return", "if", "else", "await", "throw", "new", "class",
  "extends", "implements", "null", "undefined", "true", "false", "void", "string",
  "number", "boolean", "any", "never", "unknown", "default", "switch", "case",
  "break", "for", "while", "do", "of", "in", "try", "catch", "finally", "static",
  "public", "private", "protected", "readonly", "abstract", "enum", "namespace",
  "declare", "keyof", "typeof", "instanceof", "this", "super", "use server",
  "use client", "Record", "Promise", "Partial", "Required", "Omit", "Pick",
  "Exclude", "Extract", "ReturnType", "Awaited",
]);

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < line.length) {
    // Comment
    if (line[i] === "/" && line[i + 1] === "/") {
      tokens.push({ type: "comment", value: line.slice(i) });
      break;
    }

    // String (single, double, backtick)
    if (line[i] === '"' || line[i] === "'" || line[i] === "`") {
      const quote = line[i];
      let j = i + 1;
      while (j < line.length && line[j] !== quote) {
        if (line[j] === "\\") j++;
        j++;
      }
      tokens.push({ type: "string", value: line.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // Number
    if (/\d/.test(line[i]) && (i === 0 || !/[a-zA-Z_$]/.test(line[i - 1]))) {
      let j = i;
      while (j < line.length && /[\d.]/.test(line[j])) j++;
      tokens.push({ type: "number", value: line.slice(i, j) });
      i = j;
      continue;
    }

    // Word
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[a-zA-Z0-9_$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      if (KEYWORDS.has(word)) {
        tokens.push({ type: "keyword", value: word });
      } else if (/^[A-Z]/.test(word) && word.length > 1) {
        tokens.push({ type: "type", value: word });
      } else {
        tokens.push({ type: "plain", value: word });
      }
      i = j;
      continue;
    }

    // Operator / punctuation
    if (/[{}()\[\]:;<>=!+\-*|&,.]/.test(line[i])) {
      tokens.push({ type: "operator", value: line[i] });
      i++;
      continue;
    }

    // Whitespace / other
    tokens.push({ type: "plain", value: line[i] });
    i++;
  }

  return tokens;
}

const TOKEN_COLORS: Record<TokenType, string> = {
  keyword: "#ff7b72",
  string: "#a5d6ff",
  comment: "#6e7681",
  type: "#ffa657",
  number: "#79c0ff",
  operator: "#c9d1d9",
  plain: "#c9d1d9",
};

function HighlightedLine({ line }: { line: string }) {
  const tokens = tokenizeLine(line);
  return (
    <>
      {tokens.map((token, i) => (
        <span key={i} style={{ color: TOKEN_COLORS[token.type] }}>
          {token.value}
        </span>
      ))}
    </>
  );
}

interface CodeViewerProps {
  code: string;
  filename?: string;
  maxHeight?: string;
}

export function CodeViewer({ code, filename = "block.ts", maxHeight = "480px" }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const lines = code.split("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-white/10"
      style={{ background: "#0d1117" }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-white/10"
        style={{ background: "#161b22" }}
      >
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <span className="ml-2 text-[11px] font-mono text-[#6e7681]">{filename}</span>
        </div>

        <motion.button
          onClick={handleCopy}
          whileTap={{ y: 3, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors"
          style={{
            background: copied ? "rgba(35, 134, 54, 0.15)" : "rgba(255,255,255,0.06)",
            color: copied ? "#3fb950" : "#8b949e",
            border: "1px solid",
            borderColor: copied ? "rgba(63, 185, 80, 0.3)" : "rgba(255,255,255,0.1)",
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? "Copied" : "Copy"}
        </motion.button>
      </div>

      {/* Code body */}
      <div
        className="overflow-auto font-mono text-[12.5px] leading-6"
        style={{ maxHeight }}
      >
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                <td
                  className="select-none text-right pr-4 pl-4 w-10 text-[11px]"
                  style={{ color: "#3d444d", userSelect: "none" }}
                >
                  {idx + 1}
                </td>
                <td className="pr-6 whitespace-pre">
                  {line === "" ? " " : <HighlightedLine line={line} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Fade overlay at bottom to hint more code */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
        style={{
          background: "linear-gradient(to top, #0d1117 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
