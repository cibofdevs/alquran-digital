import React from 'react';

interface ColorfulArabicTextProps {
    text: string;
    className?: string;
}

const ColorfulArabicText: React.FC<ColorfulArabicTextProps> = ({ text, className = '' }) => {
    // Improved browser detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) ||
        (/iPad|iPhone|iPod/.test(navigator.userAgent) && !/(Chrome|CriOS|FxiOS)/.test(navigator.userAgent));

    if (isIOS) {
        const baseClassName = `font-arabic transition-colors duration-200 text-2xl leading-loose ${
            className.includes('text-white') ? className : 'text-gray-900 dark:text-white'
        }`;

        if (isSafari) {
            // Simplified Safari-specific rendering
            return (
                <span
                    className={`inline-block ${className}`}
                    dir="rtl"
                    lang="ar"
                >
          <span
              className={baseClassName}
              style={{
                  // Reset all transformations and effects
                  transform: 'none',
                  WebkitTransform: 'none',
                  textRendering: 'geometricPrecision',
                  WebkitTextSizeAdjust: '100%',
                  textSizeAdjust: '100%',
                  fontSynthesis: 'none'
              }}
          >
            {text}
          </span>
        </span>
            );
        }

        // Other iOS browsers
        return (
            <span className={`inline-block ${className}`} dir="rtl" lang="ar">
        <span className={baseClassName}>{text}</span>
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
        <span className={`inline-block ${className}`} dir="rtl" lang="ar">
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