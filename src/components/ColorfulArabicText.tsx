import React from 'react';

interface ColorfulArabicTextProps {
  text: string;
  className?: string;
}

const ColorfulArabicText: React.FC<ColorfulArabicTextProps> = ({ text, className = '' }) => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  if (isIOS) {
    // Different rendering for Safari vs other iOS browsers
    const baseClassName = `font-arabic transition-colors duration-200 text-2xl leading-loose ${
        className.includes('text-white')
            ? className
            : 'text-gray-900 dark:text-white'
    }`;

    return (
        <span
            className={`inline-block ${className}`}
            dir="rtl"
            lang="ar"
        >
        {isSafari ? (
            // Safari iOS specific rendering
            <span
                className={baseClassName}
                style={{
                  // Force GPU rendering for Safari
                  transform: 'translateZ(0)',
                  WebkitTransform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  // Additional Safari text features
                  WebkitFontFeatureSettings: '"arab"',
                  fontFeatureSettings: '"arab"',
                }}
            >
            {text}
          </span>
        ) : (
            // Other iOS browsers
            <span className={baseClassName}>
            {text}
          </span>
        )}
      </span>
    );
  }

  // Desktop rendering with character-by-character styling
  const hasNextTasydid = (text: string, index: number): boolean => {
    const nextChar = text[index + 1];
    return nextChar === 'ّ';
  };

  const getCharColor = (char: string, hasTaskdid: boolean, className: string): string => {
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
      <span
          className={`inline-block ${className}`}
          dir="rtl"
          lang="ar"
      >
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