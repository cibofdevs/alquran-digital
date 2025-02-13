import React from 'react';
import { Surah } from '../types/quran';
import { Search } from 'lucide-react';
import { normalizeSurahName } from '../utils/surahNames';

const SurahIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className}
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M4 19.5v-15A2.5 2.5 0 016.5 2H20v20H6.5a2.5 2.5 0 010-5H20" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M8 7h8M8 11h8M8 15h5" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

interface SurahListProps {
  surahs: Surah[];
  onSelectSurah: (number: number) => void;
  selectedSurah?: number;
}

const SurahList: React.FC<SurahListProps> = ({ surahs = [], onSelectSurah, selectedSurah }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-gradient-to-r from-primary-100 to-accent-100 dark:from-dark-100 dark:to-dark-200 p-4 border-b border-primary-200 dark:border-dark-100 rounded-t-lg">
        <div className="flex items-center gap-2">
          <SurahIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl font-bold text-primary-700 dark:text-white">
            Surah List
          </h2>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-white to-primary-50/30 dark:from-dark-200/50 dark:to-dark-300/50">
        {surahs.length > 0 ? (
          <div className="p-4 space-y-2">
            {surahs.map((surah, index) => (
              <button
                key={surah.number}
                onClick={() => onSelectSurah(surah.number)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 hover-lift ${
                  selectedSurah === surah.number
                    ? 'bg-gradient-to-r from-primary-100 to-accent-100 dark:from-dark-100/60 dark:to-dark-200/60'
                    : 'hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 dark:hover:from-dark-100/40 dark:hover:to-dark-200/40'
                } animate-fade-in`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-medium transition-colors duration-200 ${
                    selectedSurah === surah.number
                      ? 'bg-gradient-to-r from-primary-200 to-accent-200 text-primary-700 dark:from-dark-100 dark:to-dark-200 dark:text-primary-300'
                      : 'bg-white/80 text-primary-600 shadow-sm dark:bg-dark-100/60 dark:text-gray-300'
                  }`}>
                    {surah.number}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-primary-700 dark:text-white">
                        {normalizeSurahName(surah.englishName)}
                      </h3>
                      <span className="text-right font-arabic text-lg text-primary-600 dark:text-primary-400">
                        {surah.name}
                      </span>
                    </div>
                    <p className="text-sm text-primary-600/70 dark:text-gray-400">
                      {surah.englishNameTranslation} • {surah.numberOfAyahs} Verses
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <Search className="w-12 h-12 text-primary-400 dark:text-primary-600 mb-4 animate-bounce" />
            <h3 className="text-lg font-medium text-primary-700 dark:text-white mb-2">
              No Surah Found
            </h3>
            <p className="text-sm text-primary-600/70 dark:text-gray-400">
              Try searching with a different keyword
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurahList;