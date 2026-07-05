"use client";

import { useEffect } from "react";

let audioContext: AudioContext | null = null;

function context() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  audioContext ??= new AudioContextClass();
  return audioContext;
}

export function primeCountdownAudio() {
  const ctx = context();
  if (ctx?.state === "suspended") void ctx.resume();
}

function tick(progress: number) {
  const ctx = context();
  if (!ctx || ctx.state !== "running") return;
  const now = ctx.currentTime;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(760 + progress * 360, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12 + progress * 0.05, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.06);
}

export function useAcceleratingCountdown(active: boolean, remaining: number, windowSeconds: number) {
  useEffect(() => {
    if (!active || remaining <= 0 || remaining > windowSeconds) return;
    const progress = Math.min(1, Math.max(0, (windowSeconds - remaining) / Math.max(1, windowSeconds - 1)));
    const interval = Math.round(900 - progress * 610);
    tick(progress);
    const timer = window.setInterval(() => tick(progress), interval);
    return () => window.clearInterval(timer);
  }, [active, remaining, windowSeconds]);
}
