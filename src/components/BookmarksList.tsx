import React from 'react';
import { Bookmark } from '../types/quran';
import { Bookmark as BookmarkIcon, X } from 'lucide-react';

interface BookmarksListProps {
  bookmarks: Bookmark[];
  onRemoveBookmark: (ayahNumber: number) => void;
  onSelectBookmark: (surahNumber: number, numberInSurah: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

const BookmarksList: React.FC<BookmarksListProps> = ({
  bookmarks,
  onRemoveBookmark,
  onSelectBookmark,
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 max-w-sm w-full">
        <div className="h-full bg-white dark:bg-dark-200 shadow-xl flex flex-col">
          <div className="p-4 border-b border-primary-100 dark:border-dark-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookmarkIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Bookmarks</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-dark-100 text-gray-500 dark:text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {bookmarks.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                <BookmarkIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No bookmarks yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookmarks.map((bookmark) => (
                  <div
                    key={bookmark.ayahNumber}
                    className="bg-primary-50 dark:bg-dark-100 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex flex-col">
                        <button
                          onClick={() => onSelectBookmark(bookmark.surahNumber, bookmark.numberInSurah)}
                          className="text-primary-600 dark:text-primary-400 font-medium hover:underline text-left"
                        >
                          {bookmark.surahName}
                        </button>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Verse
                          </span>
                          <span className="text-sm bg-primary-100 dark:bg-dark-300 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded">
                            {bookmark.numberInSurah}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => onRemoveBookmark(bookmark.ayahNumber)}
                        className="p-1 rounded-full hover:bg-primary-100 dark:hover:bg-dark-200"
                      >
                        <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                    <p className="text-right font-arabic text-lg text-gray-900 dark:text-white mb-2 leading-relaxed">
                      {bookmark.ayahText}
                    </p>
                    {bookmark.translation && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {bookmark.translation}
                      </p>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {new Date(bookmark.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookmarksList;