import React from 'react';

interface ColorfulArabicTextProps {
    text: string;
    className?: string;
}

const ColorfulArabicText: React.FC<ColorfulArabicTextProps> = ({ text, className = '' }) => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = isIOS && !/(Chrome|CriOS|FxiOS)/.test(navigator.userAgent);

    const baseClassName = `text-2xl leading-loose ${
        className.includes('text-white') ? className : 'text-gray-900 dark:text-white'
    }`;

    // Safari iOS specific rendering
    if (isSafari) {
        return (
            <span
                className={`inline-block ${className}`}
                dir="rtl"
                lang="ar"
            >
        <span
            className={`${baseClassName}`}
            style={{
                fontFamily: '"Arial Hebrew", "Damascus", "Al Nile", "Geeza Pro"',
                WebkitTextSizeAdjust: 'none',
                WebkitFontSmoothing: 'subpixel-antialiased',
                textRendering: 'optimizeLegibility',
                fontSynthesis: 'none'
            }}
        >
          {text}
        </span>
      </span>
        );
    }

    // iOS Chrome/Firefox
    if (isIOS) {
        return (
            <span className={`inline-block ${className}`} dir="rtl" lang="ar">
        <span className={`font-arabic ${baseClassName}`}>{text}</span>
      </span>
        );
    }

    // Desktop rendering with tasydid support
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
                  className={`${color} transition-colors duration-200 font-arabic`}
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