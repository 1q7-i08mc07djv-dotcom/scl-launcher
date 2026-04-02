import React, { useState } from 'react';

interface MySliderProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  label?: string;
}

export default function MySlider({
  value: controlledValue,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  className = '',
  label,
}: MySliderProps) {
  const [internalValue, setInternalValue] = useState(min);
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {label && (
        <span className="text-sm text-white/70 whitespace-nowrap">{label}</span>
      )}
      <div className="relative flex-1 h-6 flex items-center">
        {/* Track background */}
        <div className="absolute w-full h-1 bg-pcl-gray1 rounded-full" />
        {/* Track filled */}
        <div
          className="absolute h-1 bg-pcl-highlight rounded-full"
          style={{ width: `${percentage}%` }}
        />
        {/* Thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="
            absolute w-full h-full opacity-0 cursor-pointer
            appearance-none z-10
          "
          style={{ WebkitAppearance: 'none' }}
        />
        <div
          className="
            absolute w-3 h-3 rounded-full bg-white
            border border-pcl-highlight
            pointer-events-none
          "
          style={{ left: `calc(${percentage}% - 6px)` }}
        />
      </div>
      <span className="text-sm text-white/70 w-10 text-right">{value}</span>
    </div>
  );
}
