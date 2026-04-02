import { useState } from 'react';

interface MyCheckBoxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export default function MyCheckBox({
  checked: controlledChecked,
  onChange,
  label,
  className = '',
}: MyCheckBoxProps) {
  const [internalChecked, setInternalChecked] = useState(false);
  const checked = controlledChecked !== undefined ? controlledChecked : internalChecked;

  const handleClick = () => {
    const newChecked = !checked;
    setInternalChecked(newChecked);
    onChange?.(newChecked);
  };

  return (
    <div
      className={`
        flex items-center gap-2 cursor-pointer select-none
        ${className}
      `}
      onClick={handleClick}
    >
      <div
        className={`
          w-4 h-4 rounded border flex items-center justify-center
          transition-colors duration-150
          ${checked
            ? 'bg-pcl-highlight border-pcl-highlight'
            : 'bg-transparent border-pcl-gray1 hover:border-pcl-highlight'
          }
        `}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M1.5 5L4 7.5L8.5 2.5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      {label && (
        <span className="text-sm text-white/80">{label}</span>
      )}
    </div>
  );
}
