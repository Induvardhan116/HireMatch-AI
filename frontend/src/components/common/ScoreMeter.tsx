import React from 'react';

interface ScoreMeterProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
}

export const ScoreMeter: React.FC<ScoreMeterProps> = ({
  score,
  size = 180,
  strokeWidth = 14,
  label = "ATS Match Score",
  sublabel = "Explainable NLP Metric"
}) => {
  const normalizedScore = Math.min(Math.max(Math.round(score), 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 75) return { stroke: '#10b981', bg: 'text-emerald-500', light: 'bg-emerald-50 text-emerald-700' };
    if (s >= 50) return { stroke: '#f59e0b', bg: 'text-amber-500', light: 'bg-amber-50 text-amber-700' };
    return { stroke: '#f43f5e', bg: 'text-rose-500', light: 'bg-rose-50 text-rose-700' };
  };

  const { stroke, bg, light } = getColor(normalizedScore);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
          />
          {/* Animated score circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
            {normalizedScore}
            <span className="text-2xl font-bold text-slate-400">%</span>
          </span>
          <span className={`mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${light}`}>
            {normalizedScore >= 75 ? 'Strong Match' : normalizedScore >= 50 ? 'Moderate Match' : 'Low Match'}
          </span>
        </div>
      </div>

      <div className="text-center mt-3">
        <h4 className="text-sm font-semibold text-slate-900">{label}</h4>
        {sublabel && <p className="text-xs text-slate-500 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
};

