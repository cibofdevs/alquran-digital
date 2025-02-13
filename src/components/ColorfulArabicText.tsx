import React from 'react';

interface ColorfulArabicTextProps {
  text: string;
  className?: string;
}

const ColorfulArabicText: React.FC<ColorfulArabicTextProps> = ({ text, className = '' }) => {
  const hasNextTasydid = (text: string, index: number): boolean => {
    const nextChar = text[index + 1];
    return nextChar === 'ّ';
  };

  const getCharColor = (char: string, hasTaskdid: boolean, className: string): string => {
    // If a custom class is provided (like for Bismillah), use it instead of default colors
    if (className.includes('text-white')) {
      return className;
    }

    if (hasTaskdid) {
      return 'text-primary-600 dark:text-primary-400';
    }
    if (char === 'ّ') {
      return 'text-transparent';
    }
    return 'text-gray-900 dark:text-white';
  };

  return (
    <span className={`inline-block ${className}`} dir="rtl">
      {text.split('').map((char, index) => {
        const hasTasydid = hasNextTasydid(text, index);
        const color = getCharColor(char, hasTasydid, className);
        
        return (
          <span
            key={index}
            className={`${color} transition-colors duration-200 text-2xl leading-loose font-arabic`}
            style={{
              textShadow: hasTasydid ? '0 0 1px currentColor' : 'none'
            }}
          >
            {char}
          </span>
        );
      })}
    </span>
  );
};

export default ColorfulArabicText;