import React from 'react';

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
    const baseClassName = `font-arabic ${isBismillah ? 'bismillah-text' : 'verse-text'} ${
        className.includes('text-white') ? className : 'text-gray-900 dark:text-white'
    }`;

    // Basic common styles for all browsers
    const styles = {
        fontFeatureSettings: '"kern", "liga", "calt", "isol", "init", "fina", "medi"',
        WebkitFontFeatureSettings: '"kern", "liga", "calt", "isol", "init", "fina", "medi"',
        textRendering: 'optimizeLegibility' as const,
        WebkitFontSmoothing: 'antialiased' as const,
        MozOsxFontSmoothing: 'grayscale' as const
    };

    return (
        <span
            className={`inline-block`}
            dir="rtl"
            lang="ar"
        >
      <span
          className={baseClassName}
          style={styles}
      >
        {text}
      </span>
    </span>
    );
};

export default ColorfulArabicText;