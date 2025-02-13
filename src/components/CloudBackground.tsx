import React from 'react';

const CloudBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.03] dark:opacity-[0.02]">
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="cloud-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <path
              d="M65.5 106c-4.142 0-7.5 3.358-7.5 7.5s3.358 7.5 7.5 7.5c4.142 0 7.5-3.358 7.5-7.5s-3.358-7.5-7.5-7.5zm-30-15c-4.142 0-7.5 3.358-7.5 7.5s3.358 7.5 7.5 7.5c4.142 0 7.5-3.358 7.5-7.5s-3.358-7.5-7.5-7.5zm60 0c-4.142 0-7.5 3.358-7.5 7.5s3.358 7.5 7.5 7.5c4.142 0 7.5-3.358 7.5-7.5s-3.358-7.5-7.5-7.5zm-30-15c-4.142 0-7.5 3.358-7.5 7.5s3.358 7.5 7.5 7.5c4.142 0 7.5-3.358 7.5-7.5s-3.358-7.5-7.5-7.5z"
              fill="currentColor"
              className="text-primary-900 dark:text-white"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cloud-pattern)" />
      </svg>
    </div>
  );
};

export default CloudBackground;