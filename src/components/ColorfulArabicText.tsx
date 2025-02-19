import React, { useMemo } from 'react';

interface ColorfulArabicTextProps {
    text: string;
    className?: string;
}

const ColorfulArabicText: React.FC<ColorfulArabicTextProps> = ({ text, className = '' }) => {
    const { isIOS, isSafari } = useMemo(() => {
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        return { isIOS: ios, isSafari: ios && safari };
    }, []);

    const baseClassName = `text-2xl leading-loose ${
        className.includes('text-white') ? className : 'text-gray-900 dark:text-white'
    }`;

    if (isSafari) {
        return (
            <span
                className={`inline-block ${className}`}
                dir="rtl"
                lang="ar"
            >
        <span
            className={`font-arabic ${baseClassName}`}
            style={{
                WebkitTextSizeAdjust: '100%',
                WebkitFontSmoothing: 'subpixel-antialiased',
                fontFeatureSettings: 'ss01 1, ss02 1, ss03 1',
                textRendering: 'geometricPrecision'
            }}
        >
          {text}
        </span>
      </span>
        );
    }

    if (isIOS) {
        return (
            <span className={`inline-block ${className}`} dir="rtl" lang="ar">
        <span className={`font-arabic ${baseClassName}`}>{text}</span>
      </span>
        );
    }

    // Desktop rendering with tasydid
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