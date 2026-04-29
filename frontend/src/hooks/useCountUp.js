import { useState, useEffect, useRef } from 'react';

/**
 * Animates a number from 0 to `target` over `duration` ms.
 * Uses cubic ease-out for a cinematic feel.
 */
export function useCountUp(target, duration = 1400) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(null);

  useEffect(() => {
    if (target === null || target === undefined) return;
    if (prevTarget.current === target) return;
    prevTarget.current = target;

    const start    = 0;
    const startTs  = Date.now();

    const tick = () => {
      const elapsed  = Date.now() - startTs;
      const progress = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const eased    = 1 - Math.pow(1 - progress, 3);
      setCount(start + (target - start) * eased);
      if (progress < 1) requestAnimationFrame(tick);
      else setCount(target);
    };

    requestAnimationFrame(tick);
  }, [target, duration]);

  return count;
}
