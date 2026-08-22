import { useState, useEffect } from 'react';

export function useHoldTimer(expiresAt: string | null | undefined, onExpire?: () => void) {
  const [timeLeft, setTimeLeft] = useState<{
    minutes: number;
    seconds: number;
    totalSeconds: number;
    formatted: string;
    isExpired: boolean;
  }>({
    minutes: 0,
    seconds: 0,
    totalSeconds: 0,
    formatted: '00:00',
    isExpired: false,
  });

  useEffect(() => {
    if (!expiresAt) return;

    const targetTime = new Date(expiresAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diffMs = targetTime - now;

      if (diffMs <= 0) {
        setTimeLeft({
          minutes: 0,
          seconds: 0,
          totalSeconds: 0,
          formatted: '00:00',
          isExpired: true,
        });
        if (onExpire) onExpire();
        return;
      }

      const totalSeconds = Math.floor(diffMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      setTimeLeft({
        minutes,
        seconds,
        totalSeconds,
        formatted,
        isExpired: false,
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  return timeLeft;
}
