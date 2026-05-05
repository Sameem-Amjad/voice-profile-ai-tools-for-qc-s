import React from 'react';
import clsx from 'clsx';

export const ProgressRing = ({
  resolved,
  total,
  size = 96,
  stroke = 8,
}) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = total === 0 ? 100 : Math.round((resolved / total) * 100);
  const dashOffset = circumference * (1 - pct / 100);

  const colorClass =
    pct === 100 ? 'stroke-green-500'
    : pct >= 60 ? 'stroke-blue-500'
    : pct >= 30 ? 'stroke-yellow-500'
    : 'stroke-red-500';

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={resolved}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          className="stroke-gray-200 fill-none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={clsx('fill-none transition-all duration-500 ease-out', colorClass)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-gray-900">{resolved}/{total}</span>
        <span className="text-[10px] uppercase tracking-wider text-gray-500">resolved</span>
      </div>
    </div>
  );
};
