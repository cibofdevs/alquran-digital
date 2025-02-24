import React, { useState, useEffect, useRef } from 'react';
import { Ayah } from '../types/quran';
import { BookOpen, ChevronLeft, ChevronRight, Play, Pause, Share2, Bookmark, Link, Copy } from 'lucide-react';
import ColorfulArabicText from './ColorfulArabicText';
import { normalizeSurahName } from '../utils/surahNames';

interface SurahViewProps {
  ayahs: Ayah[];
  loading: boolean;
  onPrevSurah: () => void;
  onNextSurah: () => void;
  hasPrevSurah: boolean;
  hasNextSurah: boolean;
  onBookmark: (bookmark: Omit<Bookmark, 'timestamp'>) => void;
  onRemoveBookmark: (ayahNumber: number) => void;
  isBookmarked: (ayahNumber: number) => boolean;
  scrollToAyah?: number;
}

const SurahView: React.FC<SurahViewProps> = ({
                                               ayahs,
                                               loading,
                                               onPrevSurah,
                                               onNextSurah,
                                               hasPrevSurah,
                                               hasNextSurah,
                                               onBookmark,
                                               onRemoveBookmark,
                                               isBookmarked,
                                               scrollToAyah
                                             }) => {
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [actionTooltip, setActionTooltip] = useState<{ ayah: number; action: string; text: string } | null>(null);
  const ayahRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipTimeout = useRef<NodeJS.Timeout>();
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollToAyah && ayahRefs.current[scrollToAyah]) {
      const container = containerRef.current;
      const element = ayahRefs.current[scrollToAyah];
      const header = headerRef.current;

      if (container && element && header) {
        const headerHeight = header.offsetHeight;
        const elementTop = element.offsetTop;

        container.scrollTo({
          top: elementTop - headerHeight,
          behavior: 'smooth'
        });

        element.classList.add('animate-highlight');
        setTimeout(() => {
          element.classList.remove('animate-highlight');
        }, 2000);
      }
    }
  }, [scrollToAyah, ayahs]);

  const showActionTooltip = (ayahNumber: number, action: string, text: string) => {
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
    }
    setActionTooltip({ ayah: ayahNumber, action, text });
    tooltipTimeout.current = setTimeout(() => {
      setActionTooltip(null);
    }, 2000);
  };

  const handlePlay = async (ayahNumber: number) => {
    if (playingAyah === ayahNumber) {
      audio?.pause();
      setPlayingAyah(null);
      setAudio(null);
      showActionTooltip(ayahNumber, 'play', 'Playback stopped');
      return;
    }

    if (audio) {
      audio.pause();
      setAudio(null);
    }

    const newAudio = new Audio(`https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayahNumber}.mp3`);

    newAudio.addEventListener('ended', () => {
      setPlayingAyah(null);
      setAudio(null);
      showActionTooltip(ayahNumber, 'play', 'Playback completed');
    });

    try {
      await newAudio.play();
      setPlayingAyah(ayahNumber);
      setAudio(newAudio);
      showActionTooltip(ayahNumber, 'play', 'Playing recitation');
    } catch (error) {
      console.error('Error playing audio:', error);
      showActionTooltip(ayahNumber, 'play', 'Failed to play audio');
    }
  };

  const handleBookmark = (ayah: Ayah) => {
    if (isBookmarked(ayah.number)) {
      onRemoveBookmark(ayah.number);
      showActionTooltip(ayah.number, 'bookmark', 'Bookmark removed');
    } else {
      onBookmark({
        ayahNumber: ayah.number,
        numberInSurah: ayah.numberInSurah,
        surahNumber: ayah.surah.number,
        surahName: normalizeSurahName(ayah.surah.englishName),
        ayahText: ayah.text,
        translation: ayah.translation
      });
      showActionTooltip(ayah.number, 'bookmark', 'Bookmark added');
    }
  };

  const handleShare = async (ayah: Ayah) => {
    const surahInfo = `${normalizeSurahName(ayah.surah.englishName)} [${ayah.numberInSurah}]`;
    const shareText = `${ayah.translation}\n\n${surahInfo}`;
    const shareUrl = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${surahInfo} - Al-Quran Digital`,
          text: shareText,
          url: shareUrl
        });
        showActionTooltip(ayah.number, 'share', 'Shared successfully!');
      } else {
        const clipboardText = `${ayah.translation}\n\nRead more at: ${shareUrl}\n\n${surahInfo} - Al-Quran Digital`;
        await navigator.clipboard.writeText(clipboardText);
        showActionTooltip(ayah.number, 'share', 'Copied to clipboard!');
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return;
        }
        console.error('Share error:', error);
        showActionTooltip(ayah.number, 'share', 'Failed to share');
      }
    }
  };

  if (loading) {
    return (
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
        </div>
    );
  }

  if (!ayahs.length) {
    return (
        <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-primary-400 dark:text-primary-600" />
            <p>Select a Surah to start reading</p>
          </div>
        </div>
    );
  }

  const surahNumber = ayahs[0].surah.number;
  const showBismillah = surahNumber !== 1 && surahNumber !== 9;

  return (
      <div ref={containerRef} className="h-full overflow-y-auto bg-white/90 dark:bg-dark-200/90 rounded-lg shadow-lg backdrop-blur-sm">
        <div
            ref={headerRef}
            className="bg-gradient-to-r from-primary-500 to-accent-500 dark:from-primary-600 dark:to-accent-600 text-white p-6 rounded-t-lg sticky top-0 z-10 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <button
                onClick={onPrevSurah}
                disabled={!hasPrevSurah}
                className={`p-2 rounded-full ${
                    hasPrevSurah
                        ? 'hover:bg-white/10'
                        : 'opacity-50 cursor-not-allowed'
                }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
                onClick={onNextSurah}
                disabled={!hasNextSurah}
                className={`p-2 rounded-full ${
                    hasNextSurah
                        ? 'hover:bg-white/10'
                        : 'opacity-50 cursor-not-allowed'
                }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-center">
            {normalizeSurahName(ayahs[0].surah.englishName)}
          </h1>
          <p className="text-center text-white/80">
            {ayahs[0].surah.englishNameTranslation} • {ayahs.length} Verses
          </p>
        </div>

        {showBismillah && (
            <div className="bg-gradient-to-r from-primary-500 to-accent-500 dark:from-primary-600 dark:to-accent-600 text-white">
              <div className="bismillah-container">
                <div className="bismillah-text text-3xl font-arabic">
                  <ColorfulArabicText
                      text="بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"
                      className="text-white"
                  />
                </div>
              </div>
              <div className="text-center text-white/80 text-sm pb-3">
                In the name of Allah, the Entirely Merciful, the Especially Merciful
              </div>
            </div>
        )}

        <div className="p-6 space-y-8">
          {ayahs.map((ayah) => (
              <div
                  key={ayah.number}
                  ref={el => ayahRefs.current[ayah.number] = el}
                  className="space-y-4 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                <span className="w-8 h-8 flex items-center justify-center bg-primary-100/80 dark:bg-primary-900/40 rounded-full text-sm font-medium text-primary-700 dark:text-primary-300">
                  {ayah.numberInSurah}
                </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                          onClick={() => handlePlay(ayah.number)}
                          className="p-2 rounded-full hover:bg-primary-50/80 dark:hover:bg-dark-100/80 text-primary-600 dark:text-primary-400 group"
                      >
                        {playingAyah === ayah.number ? (
                            <Pause className="w-5 h-5" />
                        ) : (
                            <Play className="w-5 h-5" />
                        )}
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {playingAyah === ayah.number ? 'Pause recitation' : 'Play recitation'}
                    </span>
                      </button>
                      {actionTooltip && actionTooltip.ayah === ayah.number && actionTooltip.action === 'play' && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-lg animate-fade-in">
                            {actionTooltip.text}
                          </div>
                      )}
                    </div>

                    <div className="relative">
                      <button
                          onClick={() => handleBookmark(ayah)}
                          className={`p-2 rounded-full hover:bg-primary-50/80 dark:hover:bg-dark-100/80 group ${
                              isBookmarked(ayah.number)
                                  ? 'text-primary-600 dark:text-primary-400'
                                  : 'text-gray-400 dark:text-gray-500'
                          }`}
                      >
                        <Bookmark className="w-5 h-5" fill={isBookmarked(ayah.number) ? 'currentColor' : 'none'} />
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {isBookmarked(ayah.number) ? 'Remove bookmark' : 'Add bookmark'}
                    </span>
                      </button>
                      {actionTooltip && actionTooltip.ayah === ayah.number && actionTooltip.action === 'bookmark' && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-lg animate-fade-in">
                            {actionTooltip.text}
                          </div>
                      )}
                    </div>

                    <div className="relative">
                      <button
                          onClick={() => handleShare(ayah)}
                          className="p-2 rounded-full hover:bg-primary-50/80 dark:hover:bg-dark-100/80 text-primary-600 dark:text-primary-400 group"
                      >
                        {navigator.share ? <Share2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {navigator.share ? 'Share verse' : 'Copy verse'}
                    </span>
                      </button>
                      {actionTooltip && actionTooltip.ayah === ayah.number && actionTooltip.action === 'share' && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-lg animate-fade-in">
                            {actionTooltip.text}
                          </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <ColorfulArabicText text={ayah.text} />
                </div>
                {ayah.translation && (
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {ayah.translation}
                    </p>
                )}
              </div>
          ))}
        </div>
      </div>
  );
};

export default SurahView;