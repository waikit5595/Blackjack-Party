'use client';

import { useCallback } from "react";

function playTone(frequency: number, duration: number, type: OscillatorType, gainValue = 0.03) {
  if (typeof window === "undefined") return;
  const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextCtor) return;

  const ctx = new AudioContextCtor();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = gainValue;

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);

  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
    ctx.close();
  };
}

export function useGameSound() {
  const playDeal = useCallback(() => playTone(520, 0.06, "triangle", 0.025), []);
  const playAction = useCallback(() => playTone(340, 0.08, "square", 0.025), []);
  const playBlackjack = useCallback(() => {
    playTone(659, 0.08, "triangle", 0.03);
    setTimeout(() => playTone(880, 0.11, "triangle", 0.03), 90);
  }, []);
  const playBust = useCallback(() => {
    playTone(220, 0.12, "sawtooth", 0.035);
    setTimeout(() => playTone(165, 0.18, "sawtooth", 0.035), 110);
  }, []);
  const playReveal = useCallback(() => {
    playTone(523, 0.08, "triangle", 0.03);
    setTimeout(() => playTone(659, 0.08, "triangle", 0.03), 90);
    setTimeout(() => playTone(784, 0.12, "triangle", 0.03), 180);
  }, []);

  return { playDeal, playAction, playBlackjack, playBust, playReveal };
}
