import { useState, useEffect } from 'react';
import { Bookmark } from '../types/quran';

const BOOKMARKS_KEY = 'quran-bookmarks';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try {
      const saved = localStorage.getItem(BOOKMARKS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  }, [bookmarks]);

  const addBookmark = (bookmark: Omit<Bookmark, 'timestamp'>) => {
    setBookmarks(prev => {
      const exists = prev.some(b => b.ayahNumber === bookmark.ayahNumber);
      if (exists) return prev;
      return [{ ...bookmark, timestamp: Date.now() }, ...prev]; // Add new bookmarks at the beginning
    });
  };

  const removeBookmark = (ayahNumber: number) => {
    setBookmarks(prev => prev.filter(b => b.ayahNumber !== ayahNumber));
  };

  const isBookmarked = (ayahNumber: number) => {
    return bookmarks.some(b => b.ayahNumber === ayahNumber);
  };

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked
  };
}