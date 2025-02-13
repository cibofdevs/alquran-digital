import React, { useEffect, useState } from 'react';
import { Ayah, Surah, QuranResponse, SurahResponse } from './types/quran';
import SurahList from './components/SurahList';
import SurahView from './components/SurahView';
import ThemeToggle from './components/ThemeToggle';
import CloudBackground from './components/CloudBackground';
import { Menu, X, Search, Heart, Bookmark } from 'lucide-react';
import BookmarksList from './components/BookmarksList';
import { useBookmarks } from './hooks/useBookmarks';
import QuranLogo from './components/QuranLogo';

function App() {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number>();
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const { bookmarks, addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const [scrollToAyah, setScrollToAyah] = useState<number>();
  const [pendingScroll, setPendingScroll] = useState<{surah: number, numberInSurah: number} | null>(null);

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const response = await fetch('https://api.alquran.cloud/v1/surah');
        if (!response.ok) {
          throw new Error('Failed to fetch surahs');
        }
        const data: QuranResponse = await response.json();
        if (data.code === 200 && Array.isArray(data.data)) {
          setSurahs(data.data);
        }
      } catch (error) {
        console.error('Error fetching surahs:', error);
        setError('Failed to load surahs. Please try again later.');
      }
    };

    fetchSurahs();
  }, []);

  useEffect(() => {
    const fetchSurah = async (number: number) => {
      setLoading(true);
      setError(null);
      try {
        const [arabicResponse, englishResponse] = await Promise.all([
          fetch(`https://api.alquran.cloud/v1/surah/${number}/ar.alafasy`),
          fetch(`https://api.alquran.cloud/v1/surah/${number}/en.asad`)
        ]);

        if (!arabicResponse.ok || !englishResponse.ok) {
          throw new Error(`Failed to fetch surah ${number}`);
        }

        const [arabicData, englishData]: [SurahResponse, SurahResponse] = await Promise.all([
          arabicResponse.json(),
          englishResponse.json()
        ]);

        if (arabicData.code === 200 && englishData.code === 200) {
          const processedArabicAyahs = arabicData.data.ayahs.map((ayah, index) => {
            if (index === 0 && number !== 9) {
              let text = ayah.text;
              const bismillahLength = 39;

              if (text.length > bismillahLength) {
                text = text.substring(bismillahLength).trimStart();
                return { ...ayah, text };
              }
            }
            return ayah;
          });

          const combinedAyahs = processedArabicAyahs.map((ayah, index) => ({
            ...ayah,
            translation: englishData.data.ayahs[index].text,
            surah: surahs.find(s => s.number === number) || ayah.surah
          }));

          setAyahs(combinedAyahs);

          // If there's a pending scroll after surah load, set it now
          if (pendingScroll && pendingScroll.surah === number) {
            // Find the ayah with matching numberInSurah
            const ayah = combinedAyahs.find(a => a.numberInSurah === pendingScroll.numberInSurah);
            if (ayah) {
              setScrollToAyah(ayah.number);
            }
            setPendingScroll(null);
          }
        }
      } catch (error) {
        console.error('Error fetching surah:', error);
        setError('Failed to load surah. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (selectedSurah) {
      fetchSurah(selectedSurah);
    } else {
      setAyahs([]);
    }
  }, [selectedSurah, surahs, pendingScroll]);

  const handleSurahSelect = (number: number) => {
    setSelectedSurah(number);
    setIsMobileMenuOpen(false);
    setError(null);
    setScrollToAyah(undefined);
  };

  const handleBookmarkSelect = (surahNumber: number, numberInSurah: number) => {
    if (selectedSurah === surahNumber) {
      // If we're already on the correct surah, scroll to the verse
      const ayah = ayahs.find(a => a.numberInSurah === numberInSurah);
      if (ayah) {
        setScrollToAyah(undefined); // Reset first
        setTimeout(() => {
          setScrollToAyah(ayah.number);
        }, 0);
      }
    } else {
      // If we need to load a different surah
      setPendingScroll({ surah: surahNumber, numberInSurah });
      setSelectedSurah(surahNumber);
    }
    setShowBookmarks(false);
  };

  const filteredSurahs = surahs.filter(surah => 
    surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    surah.englishNameTranslation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-dark-300 transition-colors flex flex-col">
      <CloudBackground />
      
      <header className="bg-white/80 dark:bg-dark-200/80 shadow-sm transition-colors sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 -m-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
              <QuranLogo className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                Al-Quran Digital
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-600 dark:text-primary-400" />
                <input
                  type="text"
                  placeholder="Search surah..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-100 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button
                onClick={() => setShowBookmarks(true)}
                className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-primary-600 dark:text-primary-400"
                aria-label="Show bookmarks"
              >
                <Bookmark className="w-5 h-5" />
                {bookmarks.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-secondary-500 text-white text-xs rounded-full flex items-center justify-center">
                    {bookmarks.length}
                  </span>
                )}
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 relative">
        {error && (
          <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg animate-fade-in">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:sticky md:top-24 md:self-start">
            <div
              className={`fixed md:relative inset-y-0 left-0 transform ${
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
              } md:translate-x-0 transition-transform duration-300 ease-in-out z-50 w-80 md:w-auto bg-white dark:bg-dark-200 h-screen md:h-[calc(100vh-8rem)] overflow-hidden md:rounded-lg md:shadow-lg`}
            >
              <div className="md:hidden p-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-600 dark:text-primary-400" />
                  <input
                    type="text"
                    placeholder="Search surah..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-100 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
              <SurahList
                surahs={filteredSurahs}
                onSelectSurah={handleSurahSelect}
                selectedSurah={selectedSurah}
              />
            </div>
          </div>

          <div className="md:col-span-2 h-[calc(100vh-8rem)] overflow-hidden">
            <SurahView 
              ayahs={ayahs}
              loading={loading}
              onPrevSurah={() => selectedSurah && setSelectedSurah(selectedSurah - 1)}
              onNextSurah={() => selectedSurah && setSelectedSurah(selectedSurah + 1)}
              hasPrevSurah={selectedSurah ? selectedSurah > 1 : false}
              hasNextSurah={selectedSurah ? selectedSurah < 114 : false}
              onBookmark={addBookmark}
              onRemoveBookmark={removeBookmark}
              isBookmarked={isBookmarked}
              scrollToAyah={scrollToAyah}
            />
          </div>
        </div>
      </main>

      <footer className="py-4 bg-white/80 dark:bg-dark-200/80 backdrop-blur-sm mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
            <span>Made with</span>
            <Heart 
              className="w-4 h-4" 
              style={{ fill: 'url(#heart-gradient)', stroke: 'none' }}
            />
            <span>by</span>
            <span className="font-medium text-gray-900 dark:text-white">Ahmad Wijaya</span>
            <span className="mx-2">•</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>

      <BookmarksList
        bookmarks={bookmarks}
        onRemoveBookmark={removeBookmark}
        onSelectBookmark={(surahNumber, ayahNumber) => handleBookmarkSelect(surahNumber, ayahNumber)}
        isOpen={showBookmarks}
        onClose={() => setShowBookmarks(false)}
      />

      <svg width="0" height="0" style={{ position: 'absolute', visibility: 'hidden' }}>
        <defs>
          <linearGradient id="heart-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#0090ff" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export default App;