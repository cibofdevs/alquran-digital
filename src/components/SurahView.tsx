import React, { useState, useEffect, useRef } from 'react';
import { Ayah, Bookmark } from '../types/quran';
import { BookOpen, ChevronLeft, ChevronRight, Play, Pause, Share2, Bookmark as BookmarkIcon, Copy } from 'lucide-react';
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
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const ayahRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipTimeout = useRef<NodeJS.Timeout | undefined>();
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

  // Stop audio when ayahs change (user navigates to different surah)
  useEffect(() => {
    if (audio) {
      audio.pause();
      setAudio(null);
      setPlayingAyah(null);
    }
  }, [ayahs]);

  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        setAudio(null);
      }
      if (audioContext) {
        audioContext.close();
      }
    };
  }, [audio, audioContext]);

  // Initialize AudioContext and setup user interaction detection
  useEffect(() => {
    const initAudioContext = () => {
      if (!audioContext) {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
      }
    };

    const handleUserInteraction = (event: Event) => {
      if (!userHasInteracted) {
        // Only count meaningful interactions, not accidental scrolls or passive touches
        const isValidInteraction = 
          event.type === 'click' || 
          event.type === 'keydown' ||
          (event.type === 'touchend' && event.target && 
           (event.target as HTMLElement).closest('button, [role="button"], .clickable'));
        
        if (isValidInteraction) {
          setUserHasInteracted(true);
          initAudioContext();
          
          // Resume AudioContext if suspended
          if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
          }
        }
      }
    };

    // Add event listeners for user interaction - more specific events
    const events = ['click', 'keydown', 'touchend'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [userHasInteracted, audioContext]);

  // Handle delayed audio playback when user interaction is detected
  useEffect(() => {
    if (userHasInteracted && audio && playingAyah && audioContext) {
      const playDelayedAudio = async () => {
        try {
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }
          await audio.play();
          scrollToAyahCard(playingAyah);
        } catch (error) {
           console.error('Failed to play delayed audio:', error);
         }
      };
      
      playDelayedAudio();
    }
  }, [userHasInteracted, audio, playingAyah, audioContext]);

  const showActionTooltip = (ayahNumber: number, action: string, text: string) => {
    if (tooltipTimeout.current) {
      clearTimeout(tooltipTimeout.current);
    }
    setActionTooltip({ ayah: ayahNumber, action, text });
    tooltipTimeout.current = setTimeout(() => {
      setActionTooltip(null);
    }, 2000);
  };

  const getNextAyah = (currentAyahNumber: number): Ayah | null => {
    const currentIndex = ayahs.findIndex(ayah => ayah.number === currentAyahNumber);
    if (currentIndex !== -1 && currentIndex < ayahs.length - 1) {
      return ayahs[currentIndex + 1];
    }
    return null;
  };

  const scrollToAyahCard = (ayahNumber: number) => {
    const container = containerRef.current;
    const element = ayahRefs.current[ayahNumber];
    const header = headerRef.current;

    if (container && element && header) {
      const headerHeight = header.offsetHeight;
      const elementTop = element.offsetTop;

      container.scrollTo({
        top: elementTop - headerHeight - 20, // 20px extra padding
        behavior: 'smooth'
      });
    }
  };

  // Helper function to handle audio playback with mobile browser support
  const playAudioWithMobileSupport = async (audio: HTMLAudioElement): Promise<void> => {
    try {
      // Ensure AudioContext is resumed for mobile browsers
      if (audioContext && audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      await audio.play();
    } catch (error) {
       console.error('Audio playback failed:', error);
       
       // If autoplay fails and user hasn't interacted, wait for interaction
       if (!userHasInteracted) {
         throw new Error('User interaction required for audio playback');
       }
       
       throw error;
     }
  };

  const playNextAyah = async (currentAyahNumber: number) => {
    const nextAyah = getNextAyah(currentAyahNumber);
    if (nextAyah) {
      await handlePlayWithoutTooltip(nextAyah.number);
    }
  };

  const handlePlayWithoutTooltip = async (ayahNumber: number) => {
    if (playingAyah === ayahNumber) {
      audio?.pause();
      setPlayingAyah(null);
      setAudio(null);
      return;
    }

    if (audio) {
      audio.pause();
      setAudio(null);
    }

    const newAudio = new Audio(`https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayahNumber}.mp3`);

    newAudio.addEventListener('ended', async () => {
      setPlayingAyah(null);
      setAudio(null);
      
      // Auto-play next ayah
      setTimeout(async () => {
        await playNextAyah(ayahNumber);
      }, 1000); // 1 second delay before playing next ayah
    });

    try {
      await playAudioWithMobileSupport(newAudio);
      setPlayingAyah(ayahNumber);
      setAudio(newAudio);
      
      // Scroll to the currently playing ayah
      scrollToAyahCard(ayahNumber);
    } catch (error) {
        console.error('Error playing audio:', error);
        
        // If user interaction is required, the audio will be played when user interacts
        if (error instanceof Error && error.message === 'User interaction required for audio playback') {
          // Store the audio for later playback
          setAudio(newAudio);
          setPlayingAyah(ayahNumber);
        }
      }
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

    newAudio.addEventListener('ended', async () => {
      setPlayingAyah(null);
      setAudio(null);
      showActionTooltip(ayahNumber, 'play', 'Playback completed');
      
      // Auto-play next ayah
       setTimeout(async () => {
         await playNextAyah(ayahNumber);
       }, 1000); // 1 second delay before playing next ayah
    });

    try {
      await playAudioWithMobileSupport(newAudio);
      setPlayingAyah(ayahNumber);
      setAudio(newAudio);
      showActionTooltip(ayahNumber, 'play', 'Playing recitation');
      
      // Scroll to the currently playing ayah
      scrollToAyahCard(ayahNumber);
    } catch (error) {
      console.error('Error playing audio:', error);
      
      if (error instanceof Error && error.message === 'User interaction required for audio playback') {
        showActionTooltip(ayahNumber, 'play', 'Tap to enable audio playback');
        // Store the audio for later playback
        setAudio(newAudio);
        setPlayingAyah(ayahNumber);
      } else {
        showActionTooltip(ayahNumber, 'play', 'Failed to play audio');
      }
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
      if (typeof navigator.share === 'function') {
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
        {/* Mobile autoplay notice */}
        {!userHasInteracted && (
          <div className="bg-orange-100 dark:bg-orange-900/30 border-l-4 border-orange-500 p-4 text-sm sticky top-0 z-20">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Play className="w-5 h-5 text-orange-500 animate-pulse" />
              </div>
              <div className="ml-3">
                <p className="text-orange-700 dark:text-orange-300 font-medium">
                  <strong>Audio Playback:</strong> Tap any button or click anywhere to enable audio recitation on mobile devices.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div
            ref={headerRef}
            className="bg-gradient-to-r from-primary-500 to-accent-500 dark:from-primary-600 dark:to-accent-600 text-white p-6 rounded-t-lg sticky top-0 z-10 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <button
                onClick={onPrevSurah}
                disabled={!hasPrevSurah}
                className={`clickable p-2 rounded-full ${
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
                className={`clickable p-2 rounded-full ${
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
                          className={`clickable p-2 rounded-full hover:bg-primary-50/80 dark:hover:bg-dark-100/80 group ${
                            playingAyah === ayah.number && !userHasInteracted && audio
                              ? 'text-orange-500 dark:text-orange-400 animate-pulse'
                              : 'text-primary-600 dark:text-primary-400'
                          }`}
                      >
                        {playingAyah === ayah.number ? (
                            <Pause className="w-5 h-5" />
                        ) : (
                            <Play className="w-5 h-5" />
                        )}
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {playingAyah === ayah.number && !userHasInteracted && audio
                            ? 'Tap anywhere to enable audio'
                            : playingAyah === ayah.number ? 'Pause recitation' : 'Play recitation'
                          }
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
                          className={`clickable p-2 rounded-full hover:bg-primary-50/80 dark:hover:bg-dark-100/80 group ${
                              isBookmarked(ayah.number)
                                  ? 'text-primary-600 dark:text-primary-400'
                                  : 'text-gray-400 dark:text-gray-500'
                          }`}
                      >
                        <BookmarkIcon className="w-5 h-5" fill={isBookmarked(ayah.number) ? 'currentColor' : 'none'} />
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
                          className="clickable p-2 rounded-full hover:bg-primary-50/80 dark:hover:bg-dark-100/80 text-primary-600 dark:text-primary-400 group"
                      >
                        {typeof navigator.share === 'function' ? <Share2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {typeof navigator.share === 'function' ? 'Share verse' : 'Copy verse'}
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