import { useState } from 'react';

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
        <span className="text-sm whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </span>
      )}
      <div className="relative flex-1 h-6 flex items-center">
        <div className="absolute w-full h-1 rounded-full" style={{ backgroundColor: 'var(--color-gray1)' }} />
        <div
          className="absolute h-1 rounded-full"
          style={{ width: `${percentage}%`, backgroundColor: 'var(--color-highlight)' }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className="absolute w-full h-full opacity-0 cursor-pointer appearance-none z-10"
          style={{ WebkitAppearance: 'none' }}
        />
        <div
          className="absolute w-3 h-3 rounded-full pointer-events-none border-2"
          style={{
            left: `calc(${percentage}% - 6px)`,
            backgroundColor: 'white',
            borderColor: 'var(--color-highlight)',
          }}
        />
      </div>
      <span className="text-sm w-10 text-right" style={{ color: 'var(--color-text-secondary)' }}>
        {value}
      </span>
    </div>
  );
}
