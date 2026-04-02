import { useState } from 'react';
import type { ChangeEvent } from 'react';

interface MyTextBoxProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  type?: 'text' | 'password' | 'number';
}

export default function MyTextBox({
  value: controlledValue,
  onChange,
  placeholder,
  className = '',
  type = 'text',
}: MyTextBoxProps) {
  const [internalValue, setInternalValue] = useState('');
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInternalValue(e.target.value);
    onChange?.(e.target.value);
  };

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={`
        w-full h-8 px-3 rounded border text-sm
        bg-pcl-semi-transparent text-white
        placeholder:text-white/30
        border-pcl-gray1
        focus:outline-none focus:border-pcl-highlight
        transition-colors duration-150
        ${className}
      `}
    />
  );
}
