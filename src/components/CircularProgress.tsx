import React from 'react';

interface CircularProgressProps {
  percentage: number;
  label: string;
  color?: string;
  size?: number;
}

export function CircularProgress({ 
  percentage, 
  label, 
  color = '#4F46E5',
  size = 120 
}: CircularProgressProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColorByPercentage = (percent: number) => {
    if (percent === 100) return '#10B981'; // Verde para 100%
    if (percent >= 80) return '#F59E0B';   // Amarelo para 80%+
    if (percent >= 50) return '#EF4444';   // Vermelho para 50%+
    return '#6366F1';                      // Roxo para menos de 50%
  };

  const finalColor = color === '#4F46E5' ? getColorByPercentage(percentage) : color;

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="#E5E7EB"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke={finalColor}
            strokeWidth="8"
            fill="none"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-in-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span 
            className="text-2xl font-bold"
            style={{ color: finalColor }}
          >
            {percentage}%
          </span>
        </div>
      </div>
      <p className="text-sm text-gray-700 font-medium text-center">{label}</p>
    </div>
  );
}