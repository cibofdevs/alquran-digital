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
    const { isSafari } = useMemo(() => {
        const ua = navigator.userAgent.toLowerCase();
        const isSafari = /safari/.test(ua) && !/(chrome|crios|firefox|fxios)/.test(ua);
        return { isSafari };
    }, []);

    const baseClassName = `font-arabic ${isBismillah ? 'bismillah-text' : 'verse-text'} ${
        className.includes('text-white') ? className : 'text-gray-900 dark:text-white'
    }`;

    // Safari-specific rendering
    if (isSafari) {
        return (
            <span
                className={`inline-block`}
                dir="rtl"
                lang="ar"
            >
        <span
            className={baseClassName}
            style={{
                fontFeatureSettings: '"kern", "liga", "clig", "calt", "isol", "init", "fina", "medi"',
                WebkitFontFeatureSettings: '"kern", "liga", "clig", "calt", "isol", "init", "fina", "medi"',
                fontSynthesis: 'none',
                letterSpacing: '-0.01em'
            }}
        >
          {text}
        </span>
      </span>
        );
    }

    // Mobile and Desktop rendering with tasydid
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
            className={`inline-block`}
            dir="rtl"
            lang="ar"
        >
      {text.split('').map((char, index) => {
          const hasTasydid = hasNextTasydid(text, index);
          const color = getCharColor(char, hasTasydid, className);

          return (
              <span
                  key={index}
                  className={`${color} transition-colors duration-200 ${baseClassName}`}
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