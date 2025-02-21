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

    return (
        <span
            className="inline-block w-full"
            dir="rtl"
            lang="ar"
        >
            <span className={baseClassName}>
                {text}
            </span>
        </span>
    );
};

export default ColorfulArabicText;