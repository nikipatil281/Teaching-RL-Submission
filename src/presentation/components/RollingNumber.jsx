import React, { useEffect, useState } from 'react';

const RollingNumber = ({
  value,
  duration = 900,
  decimals = 0,
  prefix = '',
  suffix = '',
}) => {
  const numericValue = Number(value);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let animationFrame;
    const startTime = performance.now();
    const startValue = 0;
    const delta = safeValue - startValue;

    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = 1 - ((1 - progress) ** 3);

      setDisplayValue(startValue + (delta * easedProgress));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(tick);
      }
    };

    animationFrame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrame);
  }, [duration, safeValue]);

  const formattedValue = displayValue.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return <>{prefix}{formattedValue}{suffix}</>;
};

export default RollingNumber;
