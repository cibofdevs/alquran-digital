import React, { useMemo } from 'react';

interface ColorfulArabicTextProps {
    text: string;
    className?: string;
    isBismillah?: boolean;
}

const ColorfulArabicText: React.FC<ColorfulArabicTextProps> = ({
                                                                   text,
                                                                   className = '',
                                                                   isBismillah = false
                                                               }) => {
    const { isIOS, isSafari } = useMemo(() => {
        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
        const safari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        return { isIOS: ios, isSafari: ios && safari };
    }, []);

    const textClassName = isBismillah ? 'bismillah-text' : 'verse-text';

    if (isSafari) {
        return (
            <span
                className={`inline-block ${className}`}
                dir="rtl"
                lang="ar"
            >
        <span
            className={`font-arabic ${textClassName} ${
                className.includes('text-white') ? className : 'text-gray-900 dark:text-white'
            }`}
            style={{
                fontFamily: isBismillah ? 'Damascus' : 'Geeza Pro',
                WebkitTextSizeAdjust: 'none',
                WebkitFontSmoothing: 'antialiased',
                fontFeatureSettings: '"kern"',
                textRendering: 'geometricPrecision',
                letterSpacing: '0',
                wordSpacing: 'normal'
            }}
        >
          {text}
        </span>
      </span>
        );
    }

    if (isIOS) {
        return (
            <span
                className={`inline-block ${className}`}
                dir="rtl"
                lang="ar"
            >
        <span
            className={`font-arabic ${textClassName} ${
                className.includes('text-white') ? className : 'text-gray-900 dark:text-white'
            }`}
        >
          {text}
        </span>
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
                  className={`${color} transition-colors duration-200 font-arabic ${textClassName}`}
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