import { useState } from 'react';

interface MyButtonProps {
  text: string;
  onClick?: () => void;
  colorType?: 'highlight' | 'red' | 'black';
  disabled?: boolean;
  className?: string;
  height?: number;
  width?: number | string;
}

const colorMap = {
  highlight: 'bg-pcl-highlight hover:bg-pcl-highlight-hover text-white border-blue-500',
  red: 'bg-red-500 hover:bg-red-600 text-white border-red-600',
  black: 'bg-pcl-semi-transparent hover:bg-gray-600 text-white border-pcl-gray1',
};

export default function MyButton({
  text,
  onClick,
  colorType = 'black',
  disabled = false,
  className = '',
  height = 35,
  width,
}: MyButtonProps) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        height,
        width: width ?? 'auto',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transform: pressed ? 'scale(0.97)' : hovered ? 'scale(1.02)' : 'scale(1)',
        transition: 'transform 0.1s ease',
      }}
      className={`
        rounded-pclBtn border
        ${colorMap[colorType]}
        ${className}
        flex items-center justify-center
        focus:outline-none
      `}
    >
      <span className="text-sm font-medium select-none">{text}</span>
    </button>
  );
}
