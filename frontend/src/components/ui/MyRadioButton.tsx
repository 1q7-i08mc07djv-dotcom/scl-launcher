import { useState } from 'react';

interface MyRadioButtonProps {
  text: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  logo?: string;
  logoScale?: number;
  margin?: string;
  padding?: string;
  className?: string;
}

export default function MyRadioButton({
  text,
  checked = false,
  onChange,
  logo,
  logoScale = 1,
  margin = '0 0 0 0',
  padding = '2px 8px',
  className = '',
}: MyRadioButtonProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`flex items-center rounded-full cursor-pointer select-none transition-all duration-150 ${className}`}
      style={{ margin }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onChange?.(!checked)}
    >
      <div
        className="flex items-center rounded-full transition-all duration-150 border"
        style={{
          padding,
          backgroundColor: checked
            ? 'color-mix(in srgb, var(--color-highlight) 20%, transparent)'
            : hovered
              ? 'color-mix(in srgb, var(--color-text) 10%, transparent)'
              : 'transparent',
          borderColor: checked ? 'var(--color-highlight)' : hovered ? 'color-mix(in srgb, var(--color-text) 30%, transparent)' : 'transparent',
          color: checked ? 'var(--color-text)' : hovered ? 'var(--color-text)' : 'color-mix(in srgb, var(--color-text) 70%, transparent)',
        }}
      >
        {logo && (
          <svg
            width={14 * logoScale}
            height={14 * logoScale}
            viewBox="0 0 512 512"
            className="mr-2 flex-shrink-0"
            style={{ fill: 'currentColor' }}
          >
            <path d={logo} />
          </svg>
        )}
        <span className="text-sm whitespace-nowrap">{text}</span>
      </div>
    </div>
  );
}
