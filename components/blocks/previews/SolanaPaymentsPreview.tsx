"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, ExternalLink, Copy, Check, QrCode, RefreshCw, Coins } from "lucide-react";

const DEMO = {
  reference:  "FGdDmx7LV9GnAt4XxYPSbM3NKwrpsDq8Zt2fHvnE5Ar",
  signature:  "5KtPn2...8xQ1mR",
  fullSig:    "5KtPn2wZs9XhJdMpFqCbVuN8eT4rY7mK6sL3gA1wZs9XhJdMp8xQ1mR",
  payer:      "9yZNwq...cA2mK",
  amount:     49,
  explorerUrl:"https://explorer.solana.com/tx/5KtPn2wZs9XhJdMpFqCbVuN8eT4rY7mK6sL3gA1wZs9XhJdMp8xQ1mR?cluster=devnet",
};

type Stage = "idle" | "creating" | "pending" | "polling" | "confirming" | "confirmed";

const USDC_MINT_DEVNET = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export function SolanaPaymentsPreview() {
  const [stage, setStage]     = useState<Stage>("idle");
  const [copied, setCopied]   = useState(false);
  const [pollCount, setPollCount] = useState(0);

  const run = async () => {
    if (stage === "confirmed") { setStage("idle"); setPollCount(0); return; }
    if (stage !== "idle") return;

    // 1. Create intent
    setStage("creating");
    await delay(700);

    // 2. Show pending (QR / URL)
    setStage("pending");
    await delay(1200);

    // 3. Poll twice, then simulate on-chain confirmation
    setStage("polling");
    for (let i = 1; i <= 3; i++) {
      await delay(800);
      setPollCount(i);
    }

    // 4. Confirming (running verifyPayment checks)
    setStage("confirming");
    await delay(900);

    // 5. Done
    setStage("confirmed");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(DEMO.fullSig);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 space-y-3 min-h-[460px]">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span
          className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full"
          style={{ background: "rgba(103,232,249,0.1)", border: "1px solid rgba(103,232,249,0.2)", color: "#67e8f9" }}
        >
          Devnet — test only
        </span>
        <span className="text-[10px] font-mono" style={{ color: "#6e7681" }}>
          USDC Payments Playground
        </span>
      </div>

      {/* Payment intent card */}
      <div
        className="rounded-xl p-4 border space-y-3"
        style={{ background: "rgba(22,27,34,0.8)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold" style={{ color: "#c9d1d9" }}>Admin Block — MarrowStack</p>
            <p className="text-[9px]" style={{ color: "#6e7681" }}>One-time purchase · devnet USDC</p>
          </div>
          <span className="text-xl font-black" style={{ color: "#3fb950" }}>$49</span>
        </div>

        {/* Intent info */}
        {stage !== "idle" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="space-y-1.5 text-[9px] font-mono pt-1"
            style={{ color: "#6e7681" }}
          >
            <div className="flex justify-between">
              <span>reference</span>
              <span style={{ color: "#79c0ff" }}>{DEMO.reference.slice(0, 8)}...{DEMO.reference.slice(-6)}</span>
            </div>
            <div className="flex justify-between">
              <span>mint (devnet USDC)</span>
              <span style={{ color: "#79c0ff" }}>{USDC_MINT_DEVNET.slice(0, 6)}...{USDC_MINT_DEVNET.slice(-4)}</span>
            </div>
            <div className="flex justify-between">
              <span>amount</span>
              <span style={{ color: "#3fb950" }}>49.000000 USDC</span>
            </div>
            <div className="flex justify-between">
              <span>expires</span>
              <span>10 min</span>
            </div>
          </motion.div>
        )}

        {/* Solana Pay QR placeholder */}
        {(stage === "pending" || stage === "polling") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 mt-1"
          >
            <div
              className="w-16 h-16 rounded-lg flex items-center justify-center border shrink-0"
              style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}
            >
              <QrCode size={28} style={{ color: "#3d444d" }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold mb-1" style={{ color: "#c9d1d9" }}>Scan with Phantom or Solflare</p>
              <p className="text-[9px] font-mono truncate" style={{ color: "#6e7681" }}>
                solana:{DEMO.reference.slice(0,12)}...&amount=49&spl-token=...
              </p>
              {stage === "polling" && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Loader2 size={9} className="animate-spin" style={{ color: "#6e7681" }} />
                  <span className="text-[9px]" style={{ color: "#6e7681" }}>
                    Polling for confirmation... ({pollCount}/3)
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Verification breakdown */}
      <AnimatePresence>
        {(stage === "confirming" || stage === "confirmed") && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border p-3 space-y-2"
            style={{ background: "rgba(22,27,34,0.8)", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <p className="text-[10px] font-semibold" style={{ color: "#c9d1d9" }}>On-chain verification</p>
            {[
              { check: "Tx finalized",          detail: "confirmed commitment",                      done: true },
              { check: "USDC mint correct",     detail: `4zMMC9...cDU ✓`,                            done: true },
              { check: "Amount ≥ 49 USDC",      detail: "received 49.000000 USDC ✓",                done: true },
              { check: "Recipient matches",      detail: "treasury address ✓",                        done: true },
              { check: "Reference key present", detail: `${DEMO.reference.slice(0,6)}... in tx ✓`,   done: true },
              { check: "Not already credited",  detail: "idempotency_key unique ✓",                  done: true },
            ].map((v, i) => (
              <motion.div
                key={v.check}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: stage === "confirmed" ? 0 : i * 0.1 }}
                className="flex items-center gap-2"
              >
                {stage === "confirming" && i === 5 ? (
                  <Loader2 size={10} className="animate-spin shrink-0" style={{ color: "#6e7681" }} />
                ) : (
                  <CheckCircle2 size={10} className="shrink-0" style={{ color: "#3fb950" }} />
                )}
                <span className="text-[10px]" style={{ color: "#8b949e" }}>{v.check}</span>
                <span className="text-[9px] ml-auto font-mono" style={{ color: "#3d444d" }}>{v.detail}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmed panel */}
      <AnimatePresence>
        {stage === "confirmed" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border p-4 space-y-3"
            style={{
              background: "rgba(63,185,80,0.06)",
              borderColor: "rgba(63,185,80,0.2)",
            }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 size={14} style={{ color: "#3fb950" }} />
              <span className="text-[12px] font-semibold" style={{ color: "#3fb950" }}>Payment confirmed</span>
              <span className="text-[9px] font-mono ml-auto" style={{ color: "#6e7681" }}>{DEMO.payer} paid</span>
            </div>

            <div className="flex items-center gap-2">
              <p className="text-[9px] font-mono flex-1 truncate" style={{ color: "#6e7681" }}>
                {DEMO.fullSig}
              </p>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-colors"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: copied ? "#3fb950" : "#6e7681",
                }}
              >
                {copied ? <Check size={9} /> : <Copy size={9} />}
                {copied ? "Copied" : "Copy"}
              </button>
              <a
                href={DEMO.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 rounded text-[9px] transition-colors"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#6e7681",
                }}
              >
                <ExternalLink size={9} />
                Explorer
              </a>
            </div>

            <p className="text-[10px]" style={{ color: "#6e7681" }}>
              Deliver product only after this callback. Never trust client-sent &quot;paid: true&quot;.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CTA */}
      <div className="flex items-center gap-2">
        <div className="flex-1" />
        <motion.button
          onClick={run}
          whileTap={{ y: 3 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          disabled={stage !== "idle" && stage !== "confirmed"}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-semibold"
          style={{
            background: stage === "confirmed"
              ? "rgba(255,255,255,0.08)"
              : "linear-gradient(135deg, #065f46, #059669)",
            color: "#fff",
            border: stage === "confirmed" ? "1px solid rgba(255,255,255,0.1)" : "none",
            opacity: (stage !== "idle" && stage !== "confirmed") ? 0.4 : 1,
          }}
        >
          {stage === "idle"      && <><Coins size={11} />Pay 49 USDC</>}
          {stage === "creating"  && <><Loader2 size={11} className="animate-spin" />Creating intent...</>}
          {stage === "pending"   && <><QrCode size={11} />Waiting for payment...</>}
          {stage === "polling"   && <><Loader2 size={11} className="animate-spin" />Polling on-chain...</>}
          {stage === "confirming"&& <><Loader2 size={11} className="animate-spin" />Verifying...</>}
          {stage === "confirmed" && <><RefreshCw size={11} />Run again</>}
        </motion.button>
      </div>

      {/* Feature chips */}
      <div className="flex flex-wrap gap-1.5 justify-center pt-1">
        {["reference keys", "6-point verification", "idempotency", "Solana Pay URL"].map((f) => (
          <span
            key={f}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full"
            style={{
              background: "rgba(5,150,105,0.1)",
              border: "1px solid rgba(5,150,105,0.2)",
              color: "#34d399",
            }}
          >
            <CheckCircle2 size={9} />
            {f}
          </span>
        ))}
      </div>
    </div>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
