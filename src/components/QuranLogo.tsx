import React from 'react';

const QuranLogo: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      className={className}
      aria-hidden="true"
    >
      <circle 
        cx="50" 
        cy="50" 
        r="48" 
        className="fill-primary-500" 
        stroke="currentColor" 
        strokeWidth="2"
      />
      <path 
        d="M30 30 C30 30, 50 25, 70 30 L70 70 C70 70, 50 65, 30 70 Z" 
        className="fill-primary-50" 
        stroke="currentColor" 
        strokeWidth="2"
      />
      <path 
        d="M30 30 L30 70" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
      />
      <path 
        d="M35 35 C35 35, 50 32, 65 35" 
        className="stroke-primary-300" 
        strokeWidth="1.5" 
        fill="none"
      />
      <path 
        d="M35 45 C35 45, 50 42, 65 45" 
        className="stroke-primary-300" 
        strokeWidth="1.5" 
        fill="none"
      />
      <path 
        d="M35 55 C35 55, 50 52, 65 55" 
        className="stroke-primary-300" 
        strokeWidth="1.5" 
        fill="none"
      />
      <path 
        d="M40 62 C45 60, 55 60, 60 62" 
        className="stroke-accent-500" 
        strokeWidth="2" 
        fill="none"
      />
    </svg>
  );
};

export default QuranLogo;