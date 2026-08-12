"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";

const THEME_COLORS = ["#22d3ee", "#0e7490", "#ffffff", "#facc15"];

export default function GoalConfetti() {
  useEffect(() => {
    const ball = confetti.shapeFromText({ text: "⚽", scalar: 3.5 });

    // Bal-uitbarsting vanuit het midden, alsof hij net in het net is gegaan
    confetti({
      particleCount: 20,
      shapes: [ball],
      scalar: 1,
      spread: 100,
      startVelocity: 38,
      gravity: 0.75,
      ticks: 220,
      origin: { y: 0.45 },
      disableForReducedMotion: true,
    });

    // Klassieke confetti in de site-kleuren erbovenop
    confetti({
      particleCount: 90,
      spread: 100,
      startVelocity: 42,
      colors: THEME_COLORS,
      origin: { y: 0.4 },
      ticks: 200,
      disableForReducedMotion: true,
    });

    // Twee zijstromen die nog even doorschieten, zoals bij een confetti-kanon
    const end = Date.now() + 1400;
    (function frame() {
      confetti({ particleCount: 3, angle: 60, spread: 55, startVelocity: 45, colors: THEME_COLORS, origin: { x: 0, y: 0.7 }, disableForReducedMotion: true });
      confetti({ particleCount: 3, angle: 120, spread: 55, startVelocity: 45, colors: THEME_COLORS, origin: { x: 1, y: 0.7 }, disableForReducedMotion: true });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  return null;
}
