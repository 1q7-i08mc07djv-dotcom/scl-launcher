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
      className={`
        flex items-center rounded-full cursor-pointer select-none
        transition-all duration-150
        ${className}
      `}
      style={{ margin }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onChange?.(!checked)}
    >
      <div
        className={`
          flex items-center rounded-full px-3 py-1
          transition-all duration-150 border
          ${checked
            ? 'bg-pcl-highlight/30 border-pcl-highlight text-white'
            : hovered
              ? 'bg-white/10 border-white/30 text-white'
              : 'bg-transparent border-transparent text-white/70'
          }
        `}
        style={{ padding }}
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
