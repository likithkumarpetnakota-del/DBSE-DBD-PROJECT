import { useEffect, useRef, useState } from "react";
import { IconClock } from "./Icons";

export default function Timer({ totalSeconds, remainingSeconds, onExpire }) {
  const [remaining, setRemaining] = useState(remainingSeconds ?? totalSeconds);
  const expiredRef = useRef(false);

  // Sync state if remainingSeconds prop updates from backend session fetch
  useEffect(() => {
    if (remainingSeconds !== undefined && remainingSeconds !== null) {
      setRemaining(remainingSeconds);
    }
  }, [remainingSeconds]);

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          if (!expiredRef.current) {
            expiredRef.current = true;
            onExpire?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onExpire]);

  const hrs = Math.floor(remaining / 3600);
  const mins = Math.floor((remaining % 3600) / 60);
  const secs = remaining % 60;

  const isLow = remaining <= 60;
  const isMid = remaining <= 300 && !isLow;

  const timeString = `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-sm font-bold border transition-colors ${
        isLow
          ? "text-rose-600 bg-rose-50 border-rose-200 animate-pulse"
          : isMid
          ? "text-amber-600 bg-amber-50 border-amber-200"
          : "text-indigo-600 bg-indigo-50 border-indigo-200"
      }`}
    >
      <IconClock size={16} />
      <span>{timeString}</span>
    </div>
  );
}
