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

  return (
    <div
      className={`flex items-center gap-2 cursor-pointer select-none ${className}`}
      onClick={() => {
        const next = !checked;
        setInternalChecked(next);
        onChange?.(next);
      }}
    >
      <div
        className="w-4 h-4 rounded border flex items-center justify-center transition-colors duration-150"
        style={{
          backgroundColor: checked ? 'var(--color-highlight)' : 'transparent',
          borderColor: checked ? 'var(--color-highlight)' : 'var(--color-gray1)',
        }}
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
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      )}
    </div>
  );
}
