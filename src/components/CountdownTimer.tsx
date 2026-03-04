"use client";

import { useEffect, useState } from "react";

function calcTimeLeft(deadline: Date) {
  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

export default function CountdownTimer({ deadline }: { deadline: string }) {
  const date = new Date(deadline);
  const [timeLeft, setTimeLeft] = useState(() => calcTimeLeft(date));

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTimeLeft(date)), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!timeLeft) return null;

  const { days, hours, minutes, seconds } = timeLeft;

  const urgent = days === 0 && hours < 3;

  return (
    <div className={`rounded-xl border px-4 py-3 text-center ${urgent ? "bg-red-950/30 border-red-500/30" : "bg-slate-800/60 border-slate-700/50"}`}>
      <p className={`text-xs font-medium mb-2 uppercase tracking-wide ${urgent ? "text-red-400" : "text-slate-500"}`}>
        Transfermarkt sluit over
      </p>
      <div className="flex items-center justify-center gap-2">
        {days > 0 && (
          <>
            <Digit value={days} label="dagen" urgent={urgent} />
            <Sep urgent={urgent} />
          </>
        )}
        <Digit value={hours} label="uur" urgent={urgent} />
        <Sep urgent={urgent} />
        <Digit value={minutes} label="min" urgent={urgent} />
        <Sep urgent={urgent} />
        <Digit value={seconds} label="sec" urgent={urgent} />
      </div>
    </div>
  );
}

function Digit({ value, label, urgent }: { value: number; label: string; urgent: boolean }) {
  return (
    <div className="flex flex-col items-center min-w-[36px]">
      <span className={`text-2xl font-black tabular-nums leading-none ${urgent ? "text-red-400" : "text-white"}`}>
        {String(value).padStart(2, "0")}
      </span>
      <span className={`text-[10px] mt-0.5 ${urgent ? "text-red-500/70" : "text-slate-600"}`}>{label}</span>
    </div>
  );
}

function Sep({ urgent }: { urgent: boolean }) {
  return <span className={`text-xl font-bold pb-3 ${urgent ? "text-red-500/60" : "text-slate-600"}`}>:</span>;
}
