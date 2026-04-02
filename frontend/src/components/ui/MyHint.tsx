interface MyHintProps {
  text: string;
  theme?: 'blue' | 'yellow' | 'red' | 'default';
  className?: string;
}

const themeStyles: Record<string, string> = {
  blue: 'bg-blue-500/20 border-blue-500/50 text-blue-300',
  yellow: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200',
  red: 'bg-red-500/20 border-red-500/50 text-red-300',
  default: 'bg-white/10 border-white/20 text-white/80',
};

export default function MyHint({ text, theme = 'default', className = '' }: MyHintProps) {
  return (
    <div
      className={`px-3 py-2 rounded border text-sm ${themeStyles[theme] ?? themeStyles.default} ${className}`}
    >
      {text}
    </div>
  );
}
