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
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const ayahRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipTimeout = useRef<NodeJS.Timeout | undefined>();
  const headerRef = useRef<HTMLDivElement>(null);

  // Detect real mobile device (not just screen size)
  useEffect(() => {
    const detectMobileDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isRealMobile = isMobile && isTouchDevice;
      
      console.log('[Mobile Audio Debug] Device detection:', {
        userAgent: userAgent.substring(0, 100),
        isMobile,
        isTouchDevice,
        isRealMobile,
        maxTouchPoints: navigator.maxTouchPoints
      });
      
      setIsMobileDevice(isRealMobile);
    };

    detectMobileDevice();
  }, []);

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
  // Cleanup effect - only run on component unmount
  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        setAudio(null);
      }
      // Don't close AudioContext here - let it persist for the session
      // AudioContext should be reused across multiple audio playbacks
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Initialize AudioContext and setup user interaction detection
  useEffect(() => {
    const initAudioContext = () => {
      if (!audioContext) {
        console.log('[Mobile Audio Debug] Initializing AudioContext...');
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('[Mobile Audio Debug] AudioContext created, state:', ctx.state);
        setAudioContext(ctx);
      }
    };

    const handleUserInteraction = (event: Event) => {
      console.log('[Mobile Audio Debug] User interaction detected:', event.type, event.target);
      
      if (!userHasInteracted) {
        // Only count meaningful interactions, not accidental scrolls or passive touches
        const isValidInteraction = 
          event.type === 'click' || 
          event.type === 'keydown' ||
          (event.type === 'touchend' && event.target && 
           (event.target as HTMLElement).closest('button, [role="button"], .clickable'));
        
        console.log('[Mobile Audio Debug] Is valid interaction:', isValidInteraction);
        
        if (isValidInteraction) {
          console.log('[Mobile Audio Debug] Setting userHasInteracted to true');
          setUserHasInteracted(true);
          initAudioContext();
          
          // Resume AudioContext if suspended
          if (audioContext && audioContext.state === 'suspended') {
            console.log('[Mobile Audio Debug] Resuming suspended AudioContext');
            audioContext.resume().then(() => {
              console.log('[Mobile Audio Debug] AudioContext resumed, new state:', audioContext.state);
            });
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
    console.log('[Mobile Audio Debug] Delayed audio effect triggered:', {
      userHasInteracted,
      hasAudio: !!audio,
      playingAyah,
      hasAudioContext: !!audioContext,
      audioContextState: audioContext?.state,
      isMobileDevice
    });
    
    if (userHasInteracted && audio && playingAyah && audioContext) {
      const playDelayedAudio = async () => {
        try {
          console.log('[Mobile Audio Debug] Attempting to play delayed audio...');
          console.log('[Mobile Audio Debug] AudioContext state before play:', audioContext.state);
          console.log('[Mobile Audio Debug] Is mobile device in delayed play:', isMobileDevice);
          
          // Handle closed AudioContext by creating a new one
          if (audioContext.state === 'closed') {
            console.log('[Mobile Audio Debug] AudioContext is closed in delayed play, creating new one...');
            const newCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            setAudioContext(newCtx);
            console.log('[Mobile Audio Debug] New AudioContext created for delayed play, state:', newCtx.state);
            return; // Exit and let the effect re-run with new AudioContext
          }
          
          if (audioContext.state === 'suspended') {
            console.log('[Mobile Audio Debug] Resuming AudioContext before play...');
            await audioContext.resume();
            console.log('[Mobile Audio Debug] AudioContext resumed, new state:', audioContext.state);
          }
          
          // Mobile-specific handling for delayed audio
          if (isMobileDevice) {
            console.log('[Mobile Audio Debug] Applying mobile workarounds for delayed audio...');
            
            // Ensure audio is properly loaded and ready
            if (audio.readyState < 2) {
              console.log('[Mobile Audio Debug] Audio not ready for delayed play, forcing load...');
              audio.load();
              
              // Wait for audio to be ready
              await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                  reject(new Error('Delayed audio load timeout'));
                }, 3000);
                
                const onCanPlay = () => {
                  clearTimeout(timeout);
                  audio.removeEventListener('canplay', onCanPlay);
                  audio.removeEventListener('error', onError);
                  resolve(void 0);
                };
                
                const onError = () => {
                  clearTimeout(timeout);
                  audio.removeEventListener('canplay', onCanPlay);
                  audio.removeEventListener('error', onError);
                  reject(new Error('Delayed audio load error'));
                };
                
                audio.addEventListener('canplay', onCanPlay);
                audio.addEventListener('error', onError);
              });
            }
            
            // Additional mobile-specific settings
            audio.volume = 1.0;
            audio.muted = false;
            
            // Small delay for mobile browsers
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          console.log('[Mobile Audio Debug] Calling audio.play()...');
          const playPromise = audio.play();
          
          if (playPromise !== undefined) {
            await playPromise;
            console.log('[Mobile Audio Debug] Audio play successful!');
          }
          
          scrollToAyahCard(playingAyah);
        } catch (error) {
          console.error('[Mobile Audio Debug] Failed to play delayed audio:', error);
          if (error instanceof Error) {
            console.error('[Mobile Audio Debug] Error details:', error.message);
          }
          
          // Mobile-specific error handling for delayed audio
          if (isMobileDevice && error instanceof DOMException) {
            if (error.name === 'NotAllowedError') {
              console.log('[Mobile Audio Debug] Delayed audio blocked - user interaction may have expired');
            } else if (error.name === 'AbortError') {
              console.log('[Mobile Audio Debug] Delayed audio aborted - likely due to new audio starting');
            }
          }
        }
      };
      
      playDelayedAudio();
    }
  }, [userHasInteracted, audio, playingAyah, audioContext, isMobileDevice]);

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
      console.log('[Mobile Audio Debug] playAudioWithMobileSupport called');
      console.log('[Mobile Audio Debug] AudioContext state:', audioContext?.state);
      console.log('[Mobile Audio Debug] User has interacted:', userHasInteracted);
      console.log('[Mobile Audio Debug] Is real mobile device:', isMobileDevice);
      
      // Handle closed AudioContext by creating a new one
      if (audioContext && audioContext.state === 'closed') {
        console.log('[Mobile Audio Debug] AudioContext is closed, creating new one...');
        const newCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(newCtx);
        console.log('[Mobile Audio Debug] New AudioContext created, state:', newCtx.state);
      }
      
      // Ensure AudioContext is resumed for mobile browsers
      if (audioContext && audioContext.state === 'suspended') {
        console.log('[Mobile Audio Debug] Resuming suspended AudioContext...');
        await audioContext.resume();
        console.log('[Mobile Audio Debug] AudioContext resumed, new state:', audioContext.state);
      }
      
      // Mobile-specific workarounds
      if (isMobileDevice) {
        console.log('[Mobile Audio Debug] Applying mobile-specific workarounds...');
        
        // iOS Safari specific workarounds
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        if (isIOS) {
          console.log('[Mobile Audio Debug] iOS detected - applying iOS workarounds');
          // Force load the audio
          audio.load();
          // Set volume explicitly (iOS sometimes has issues with volume)
          audio.volume = 1.0;
          // Ensure audio is not muted
          audio.muted = false;
        }
        
        // Android Chrome specific workarounds
        const isAndroidChrome = /android.*chrome/i.test(navigator.userAgent);
        if (isAndroidChrome) {
          console.log('[Mobile Audio Debug] Android Chrome detected - applying Android workarounds');
          // Ensure preload is set
          audio.preload = 'auto';
          // Force load
          audio.load();
        }
        
        // General mobile workarounds
        // Add a small delay to ensure audio is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if audio is ready to play
        if (audio.readyState < 2) {
          console.log('[Mobile Audio Debug] Audio not ready, waiting for canplay event...');
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Audio load timeout'));
            }, 5000);
            
            audio.addEventListener('canplay', () => {
              clearTimeout(timeout);
              resolve(void 0);
            }, { once: true });
            
            audio.addEventListener('error', () => {
              clearTimeout(timeout);
              reject(new Error('Audio load error'));
            }, { once: true });
          });
        }
      }
      
      console.log('[Mobile Audio Debug] Attempting audio.play()...');
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        console.log('[Mobile Audio Debug] Audio play successful in playAudioWithMobileSupport!');
      }
    } catch (error) {
       console.error('[Mobile Audio Debug] Audio playback failed in playAudioWithMobileSupport:', error);
       
       // Enhanced error handling for mobile devices
       if (isMobileDevice) {
         console.log('[Mobile Audio Debug] Mobile device error handling...');
         
         // Check if it's a user interaction issue
         if (error instanceof DOMException && error.name === 'NotAllowedError') {
           console.log('[Mobile Audio Debug] NotAllowedError - user interaction required');
           if (!userHasInteracted) {
             throw new Error('User interaction required for audio playback on mobile');
           }
         }
         
         // Check if it's a network issue
         if (error instanceof DOMException && error.name === 'NotSupportedError') {
           console.log('[Mobile Audio Debug] NotSupportedError - audio format or network issue');
           throw new Error('Audio format not supported or network error');
         }
       }
       
       // If autoplay fails and user hasn't interacted, wait for interaction
       if (!userHasInteracted) {
         console.log('[Mobile Audio Debug] User interaction required - throwing error');
         throw new Error('User interaction required for audio playback');
       }
       
       throw error;
     }
  };

  const playNextAyah = async (currentAyahNumber: number) => {
    console.log('[Mobile Audio Debug] playNextAyah called for current ayah:', currentAyahNumber);
    console.log('[Mobile Audio Debug] Is mobile device in playNextAyah:', isMobileDevice);
    console.log('[Mobile Audio Debug] User has interacted in playNextAyah:', userHasInteracted);
    
    const nextAyah = getNextAyah(currentAyahNumber);
    console.log('[Mobile Audio Debug] getNextAyah returned:', nextAyah ? nextAyah.number : 'null');
    
    if (nextAyah) {
      console.log('[Mobile Audio Debug] Calling handlePlayWithoutTooltip for ayah:', nextAyah.number);
      
      try {
        await handlePlayWithoutTooltip(nextAyah.number);
        console.log('[Mobile Audio Debug] handlePlayWithoutTooltip completed successfully for ayah:', nextAyah.number);
      } catch (error) {
        console.error('[Mobile Audio Debug] Error in handlePlayWithoutTooltip for ayah:', nextAyah.number, error);
        
        // Mobile-specific handling for playNextAyah failures
        if (isMobileDevice) {
          console.log('[Mobile Audio Debug] Mobile playNextAyah failed - likely due to autoplay restrictions');
          
          // Check if it's a user interaction issue
          if (error instanceof Error && error.message.includes('User interaction required')) {
            console.log('[Mobile Audio Debug] User interaction required for next ayah on mobile');
            showActionTooltip(nextAyah.number, 'play', 'Tap to continue recitation');
          }
        }
        
        throw error; // Re-throw to be caught by the caller
      }
    } else {
      console.log('[Mobile Audio Debug] No next ayah found, playback complete');
    }
  };

  const handlePlayWithoutTooltip = async (ayahNumber: number) => {
    console.log('[Mobile Audio Debug] handlePlayWithoutTooltip called for ayah:', ayahNumber);
    console.log('[Mobile Audio Debug] Current playing ayah:', playingAyah);
    
    if (playingAyah === ayahNumber) {
      console.log('[Mobile Audio Debug] Pausing current audio');
      audio?.pause();
      setPlayingAyah(null);
      setAudio(null);
      return;
    }

    if (audio) {
      console.log('[Mobile Audio Debug] Stopping previous audio');
      audio.pause();
      setAudio(null);
    }

    console.log('[Mobile Audio Debug] Creating new audio for ayah:', ayahNumber);
    const newAudio = new Audio(`https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayahNumber}.mp3`);

    newAudio.addEventListener('ended', async () => {
      console.log('[Mobile Audio Debug] Audio ended for ayah:', ayahNumber);
      console.log('[Mobile Audio Debug] Is mobile device:', isMobileDevice);
      console.log('[Mobile Audio Debug] User has interacted:', userHasInteracted);
      
      setPlayingAyah(null);
      setAudio(null);
      
      // Check if there's a next ayah
      const nextAyah = getNextAyah(ayahNumber);
      console.log('[Mobile Audio Debug] Next ayah found:', nextAyah ? nextAyah.number : 'none');
      
      if (!nextAyah) {
        console.log('[Mobile Audio Debug] No next ayah available, stopping auto-play');
        return;
      }
      
      // Auto-play next ayah
      setTimeout(async () => {
        console.log('[Mobile Audio Debug] Auto-playing next ayah after:', ayahNumber);
        console.log('[Mobile Audio Debug] Attempting to play ayah:', nextAyah.number);
        
        try {
          await playNextAyah(ayahNumber);
          console.log('[Mobile Audio Debug] Successfully triggered playNextAyah');
        } catch (error) {
          console.error('[Mobile Audio Debug] Error in auto-play next ayah:', error);
          
          // Mobile-specific error handling for auto-play chain
          if (isMobileDevice) {
            console.log('[Mobile Audio Debug] Mobile auto-play chain failed, user interaction may be required again');
            // Show tooltip to indicate user needs to tap again
            showActionTooltip(nextAyah.number, 'play', 'Tap to continue recitation');
          }
        }
      }, 1000); // 1 second delay before playing next ayah
    });

    try {
      console.log('[Mobile Audio Debug] Attempting to play audio with mobile support...');
      await playAudioWithMobileSupport(newAudio);
      console.log('[Mobile Audio Debug] Audio playback successful, setting state...');
      setPlayingAyah(ayahNumber);
      setAudio(newAudio);
      
      // Scroll to the currently playing ayah
      scrollToAyahCard(ayahNumber);
    } catch (error) {
        console.error('[Mobile Audio Debug] Error in handlePlayWithoutTooltip:', error);
        
        // If user interaction is required, the audio will be played when user interacts
        if (error instanceof Error && error.message === 'User interaction required for audio playback') {
          console.log('[Mobile Audio Debug] Storing audio for delayed playback');
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

    // Use handlePlayWithoutTooltip for consistent auto-play behavior
    try {
      await handlePlayWithoutTooltip(ayahNumber);
      showActionTooltip(ayahNumber, 'play', 'Playing recitation');
    } catch (error) {
      console.error('Error playing audio:', error);
      
      if (error instanceof Error && error.message === 'User interaction required for audio playback') {
        showActionTooltip(ayahNumber, 'play', 'Tap to enable audio playback');
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
                  <strong>Audio Playback:</strong> {isMobileDevice 
                    ? 'Tap any button or click anywhere to enable audio recitation. Some mobile browsers may require multiple taps for autoplay to work properly.'
                    : 'Tap any button or click anywhere to enable audio recitation on mobile devices.'
                  }
                </p>
                {isMobileDevice && (
                  <p className="text-orange-600 dark:text-orange-400 text-sm mt-1">
                    📱 Mobile device detected. If audio doesn't autoplay after interaction, try tapping the play button again.
                  </p>
                )}
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