export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  translation?: string;
  numberInSurah: number;
  juz: number;
  surah: Surah;
}

export interface QuranResponse {
  code: number;
  status: string;
  data: Surah[];
}

export interface SurahResponse {
  code: number;
  status: string;
  data: {
    ayahs: Ayah[];
    edition: {
      identifier: string;
      language: string;
      name: string;
      englishName: string;
    };
    number: number;
    englishName: string;
    name: string;
  };
}

export interface Bookmark {
  ayahNumber: number;
  numberInSurah: number; // Add this field
  surahNumber: number;
  surahName: string;
  ayahText: string;
  translation?: string;
  timestamp: number;
}