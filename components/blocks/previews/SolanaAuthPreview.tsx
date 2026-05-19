"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, CheckCircle2, XCircle, Loader2, AlertTriangle, ChevronRight, RotateCcw } from "lucide-react";

// Simulated devnet addresses for demonstration
const DEMO = {
  address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAs",
  nonce:   "a3f8e1d204c9b567e8f210cd",
  domain:  "marrowstack.dev",
  cluster: "devnet" as const,
};

type Step =
  | "idle"
  | "connecting"
  | "connected"
  | "nonce"
  | "signing"
  | "verifying"
  | "verified"
  | "tampered";

interface StepInfo {
  label:   string;
  detail?: string;
  status:  "idle" | "running" | "pass" | "fail";
  timing?: number;
}

const SIWS_MESSAGE = `${DEMO.domain} wants you to sign in with your Solana account:
${DEMO.address}

Sign in to MarrowStack with your Solana wallet.

URI: https://${DEMO.domain}
Version: 1
Chain ID: ${DEMO.cluster}
Nonce: ${DEMO.nonce}
Issued At: 2025-05-19T14:32:01.000Z
Expiration Time: 2025-05-19T14:37:01.000Z`;

export function SolanaAuthPreview() {
  const [step, setStep]       = useState<Step>("idle");
  const [tamper, setTamper]   = useState(false);
  const [steps, setSteps]     = useState<StepInfo[]>([]);
  const [elapsed, setElapsed] = useState<number | null>(null);

  const reset = () => {
    setStep("idle");
    setSteps([]);
    setTamper(false);
    setElapsed(null);
  };

  const runFlow = async () => {
    if (step !== "idle" && step !== "verified" && step !== "tampered") return;
    reset();

    const start = Date.now();

    // 1. Connect wallet
    setStep("connecting");
    await delay(600);
    setStep("connected");
    await delay(400);

    // 2. Request nonce
    setStep("nonce");
    await delay(500);

    // 3. Build + sign message
    setStep("signing");
    await delay(900);

    // 4. Verify steps
    setStep("verifying");

    const verifySteps: Array<{ label: string; detail: string; pass: boolean; ms: number }> = [
      { label: "Address format",    detail: "Base58 decode: 32 bytes ✓",          pass: true,       ms: 180 },
      { label: "Domain binding",    detail: `Expected: ${DEMO.domain} ✓`,         pass: true,       ms: 210 },
      { label: "Chain ID",          detail: `Expected: devnet ✓`,                  pass: true,       ms: 190 },
      { label: "Nonce consumed",    detail: "Atomic DB update — consumed_at set",  pass: true,       ms: 340 },
      { label: "Timestamp window",  detail: "Issued 0.3s ago — within 300s TTL",  pass: true,       ms: 165 },
      { label: "Ed25519 signature", detail: tamper
          ? "nacl.verify → FALSE — signature invalid"
          : "nacl.verify → TRUE — bytes match public key",
        pass: !tamper,      ms: 290 },
    ];

    for (const s of verifySteps) {
      setSteps((prev) => [
        ...prev,
        { label: s.label, detail: s.detail, status: "running" },
      ]);
      await delay(s.ms);
      setSteps((prev) =>
        prev.map((p, i) =>
          i === prev.length - 1
            ? { ...p, status: s.pass ? "pass" : "fail", timing: s.ms }
            : p
        )
      );
      if (!s.pass) {
        setStep("tampered");
        setElapsed(Date.now() - start);
        return;
      }
    }

    setStep("verified");
    setElapsed(Date.now() - start);
  };

  return (
    <div className="p-4 space-y-3 min-h-[460px] select-none relative">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full"
            style={{ background: "rgba(103,232,249,0.1)", border: "1px solid rgba(103,232,249,0.2)", color: "#67e8f9" }}
          >
            Devnet — test only
          </span>
          <span className="text-[10px] font-mono" style={{ color: "#6e7681" }}>
            SIWS Playground
          </span>
        </div>
        {elapsed !== null && (
          <span className="text-[9px] font-mono" style={{ color: "#6e7681" }}>
            {elapsed}ms
          </span>
        )}
      </div>

      {/* Wallet card */}
      <div
        className="rounded-xl p-4 border"
        style={{ background: "rgba(22,27,34,0.8)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet size={13} style={{ color: step === "idle" ? "#6e7681" : "#a78bfa" }} />
            <span className="text-[11px] font-medium" style={{ color: "#c9d1d9" }}>
              {step === "idle" || step === "connecting" ? "No wallet connected" : "Phantom (simulated)"}
            </span>
          </div>
          {(step === "connected" || step === "nonce" || step === "signing" || step === "verifying") && (
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[9px]" style={{ color: "#3fb950" }}>devnet</span>
            </div>
          )}
        </div>

        {step !== "idle" && (
          <p className="text-[10px] font-mono" style={{ color: "#79c0ff" }}>
            {DEMO.address.slice(0, 4)}...{DEMO.address.slice(-4)}
          </p>
        )}

        {/* SIWS message box */}
        {(step === "signing" || step === "verifying" || step === "verified" || step === "tampered") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-3 rounded-lg p-3 overflow-hidden"
            style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <p className="text-[9px] font-mono whitespace-pre leading-relaxed" style={{ color: "#6e7681" }}>
              {SIWS_MESSAGE}
            </p>
          </motion.div>
        )}

        {step === "signing" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 flex items-center gap-2"
          >
            <Loader2 size={11} className="animate-spin" style={{ color: "#a78bfa" }} />
            <span className="text-[10px]" style={{ color: "#a78bfa" }}>
              Sign message in wallet...
            </span>
          </motion.div>
        )}

        {(step === "verified" || step === "tampered") && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-lg p-3"
            style={{
              background: step === "verified"
                ? "rgba(63,185,80,0.08)"
                : "rgba(248,81,73,0.08)",
              border: `1px solid ${step === "verified" ? "rgba(63,185,80,0.2)" : "rgba(248,81,73,0.2)"}`,
            }}
          >
            {step === "verified" ? (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold" style={{ color: "#3fb950" }}>Session issued ✓</p>
                <p className="text-[9px] font-mono" style={{ color: "#6e7681" }}>
                  {`{ userId: "usr_8f2e...", walletAddress: "${DEMO.address.slice(0,8)}...", role: "user" }`}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold" style={{ color: "#f85149" }}>Verification rejected</p>
                <p className="text-[9px]" style={{ color: "#6e7681" }}>
                  Ed25519 signature mismatch — replay/tamper detected
                </p>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Verification steps */}
      {steps.length > 0 && (
        <div
          className="rounded-xl border p-3 space-y-1.5"
          style={{ background: "rgba(22,27,34,0.8)", borderColor: "rgba(255,255,255,0.08)" }}
        >
          <p className="text-[10px] font-semibold mb-2" style={{ color: "#c9d1d9" }}>Server verification</p>
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              {s.status === "running" ? (
                <Loader2 size={10} className="animate-spin shrink-0" style={{ color: "#6e7681" }} />
              ) : s.status === "pass" ? (
                <CheckCircle2 size={10} className="shrink-0" style={{ color: "#3fb950" }} />
              ) : (
                <XCircle size={10} className="shrink-0" style={{ color: "#f85149" }} />
              )}
              <span className="text-[10px]" style={{ color: s.status === "fail" ? "#f85149" : "#8b949e" }}>
                {s.label}
              </span>
              {s.detail && s.status !== "running" && (
                <span className="text-[9px] ml-auto font-mono" style={{ color: "#3d444d" }}>
                  {s.detail}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2">
        {/* Tamper toggle */}
        <button
          onClick={() => setTamper(!tamper)}
          disabled={step !== "idle"}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all"
          style={{
            background: tamper ? "rgba(248,81,73,0.15)" : "rgba(255,255,255,0.05)",
            border: `1px solid ${tamper ? "rgba(248,81,73,0.3)" : "rgba(255,255,255,0.08)"}`,
            color: tamper ? "#f85149" : "#6e7681",
            opacity: step !== "idle" ? 0.4 : 1,
          }}
        >
          <AlertTriangle size={10} />
          {tamper ? "Tamper ON" : "Tamper OFF"}
        </button>

        <div className="flex-1" />

        {/* Reset */}
        {step !== "idle" && (
          <motion.button
            onClick={reset}
            whileTap={{ y: 3 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px]"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#6e7681",
            }}
          >
            <RotateCcw size={10} />
            Reset
          </motion.button>
        )}

        {/* Run */}
        <motion.button
          onClick={runFlow}
          whileTap={{ y: 3 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
          disabled={step !== "idle" && step !== "verified" && step !== "tampered"}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[11px] font-semibold"
          style={{
            background: tamper
              ? "linear-gradient(135deg, #7f1d1d, #991b1b)"
              : "linear-gradient(135deg, #5b21b6, #6d28d9)",
            color: "#fff",
            opacity: (step !== "idle" && step !== "verified" && step !== "tampered") ? 0.4 : 1,
          }}
        >
          {step === "idle" || step === "verified" || step === "tampered" ? (
            <>
              {tamper ? <AlertTriangle size={11} /> : <ChevronRight size={11} />}
              {tamper ? "Run (tampered)" : "Sign In With Solana"}
            </>
          ) : (
            <>
              <Loader2 size={11} className="animate-spin" />
              Running...
            </>
          )}
        </motion.button>
      </div>

      {/* Feature chips */}
      <div className="flex flex-wrap gap-1.5 justify-center pt-1">
        {["ed25519 server-verify", "single-use nonces", "domain binding", "replay-proof"].map((f) => (
          <span
            key={f}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full"
            style={{
              background: "rgba(167,139,250,0.1)",
              border: "1px solid rgba(167,139,250,0.2)",
              color: "#a78bfa",
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
