/**
 * Kur'an Coğrafyası - External API Service & Resilient In-Memory Cache
 * Integrations:
 * 1. Wikipedia REST API v1
 * 2. Quran.com API v4 (Arabic Uthmani + Translations + Audio)
 */

class ApiService {
  constructor() {
    this.wikiCache = new Map();
    this.quranCache = new Map();
  }

  /**
   * Fetch Wikipedia summary and thumbnail for a given slug and language
   * @param {string} slug - Wikipedia title slug (e.g. "Mekke", "Mecca")
   * @param {string} lang - 'tr' or 'en'
   * @returns {Promise<{title: string, extract: string, thumbnail: string|null, url: string}>}
   */
  async getWikipediaSummary(slug, lang = 'tr') {
    if (!slug) return null;
    const cacheKey = `${lang}:${slug}`;
    if (this.wikiCache.has(cacheKey)) {
      return this.wikiCache.get(cacheKey);
    }

    const cleanSlug = encodeURIComponent(slug.trim().replace(/ /g, '_'));
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${cleanSlug}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Wikipedia HTTP ${response.status}`);
      }

      const data = await response.json();
      const result = {
        title: data.title || slug,
        extract: data.extract || '',
        thumbnail: data.thumbnail?.source || null,
        url: data.content_urls?.desktop?.page || `https://${lang}.wikipedia.org/wiki/${cleanSlug}`
      };

      this.wikiCache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.warn(`Wikipedia fetch failed for [${slug}] (${lang}):`, err.message);
      // Fallback object so UI does not break
      return {
        title: slug.replace(/_/g, ' '),
        extract: lang === 'tr' 
          ? 'Wikipedia bilgisi yüklenemedi veya internet bağlantısı yok.' 
          : 'Wikipedia summary unavailable or offline.',
        thumbnail: null,
        url: `https://${lang}.wikipedia.org/wiki/${cleanSlug}`
      };
    }
  }

  /**
   * Fetch a Quran verse with Arabic Uthmani text and translation from Quran.com v4
   * @param {string} verseKey - Format "surah:ayah", e.g. "17:1", "48:24"
   * @param {string} lang - 'tr' or 'en'
   * @returns {Promise<{verseKey: string, textArabic: string, translation: string, audioUrl: string|null}>}
   */
  async getQuranVerse(verseKey, lang = 'tr') {
    if (!verseKey) return null;
    const cacheKey = `${lang}:${verseKey}`;
    if (this.quranCache.has(cacheKey)) {
      return this.quranCache.get(cacheKey);
    }

    // Translation IDs: 77 = Diyanet İşleri (TR), 131 = The Clear Quran by Dr. Mustafa Khattab (EN)
    const translationId = lang === 'tr' ? 77 : 131;
    const url = `https://api.quran.com/api/v4/verses/by_key/${verseKey}?language=${lang}&words=false&translations=${translationId}&fields=text_uthmani`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Quran.com HTTP ${response.status}`);
      }

      const data = await response.json();
      const verse = data.verse;
      const textArabic = verse?.text_uthmani || '';
      
      // Clean HTML tags from translation text
      let translationText = verse?.translations?.[0]?.text || '';
      translationText = translationText.replace(/<[^>]*>?/gm, '').trim();

      // Audio recitation endpoint: Reciter 7 (Mishary Rashid Alafasy)
      const audioUrl = await this.getAyahAudioUrl(verseKey);

      const result = {
        verseKey,
        textArabic,
        translation: translationText,
        audioUrl
      };

      this.quranCache.set(cacheKey, result);
      return result;
    } catch (err) {
      console.warn(`Quran.com fetch failed for [${verseKey}]:`, err.message);
      return {
        verseKey,
        textArabic: '',
        translation: lang === 'tr' 
          ? `(Ayet meali yüklenemedi: Sure ${verseKey})` 
          : `(Verse translation unavailable: Surah ${verseKey})`,
        audioUrl: null
      };
    }
  }

  /**
   * Helper to fetch audio URL for an ayah
   */
  async getAyahAudioUrl(verseKey) {
    try {
      // Recitation ID 7 is Mishary Rashid Alafasy
      const url = `https://api.quran.com/api/v4/recitations/7/by_ayah/${verseKey}`;
      const res = await fetch(url);
      if (!res.ok) return null;
      const data = await res.json();
      const audioPath = data.audio_files?.[0]?.url;
      if (audioPath) {
        return audioPath.startsWith('http') ? audioPath : `https://verses.quran.com/${audioPath}`;
      }
      return null;
    } catch {
      return null;
    }
  }
}

export const api = new ApiService();
