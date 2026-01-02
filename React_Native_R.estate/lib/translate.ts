// Cache translations to avoid repeated API calls
const translationCache: { [key: string]: string } = {};

const LANGUAGE_MAP: { [key: string]: string } = {
  en: "en",
  sq: "sq",
};

export const translateText = async (
  text: string,
  targetLang: string
): Promise<string> => {
  if (!text || targetLang === "en") {
    return text;
  }

  // Check cache first
  const cacheKey = `${targetLang}:${text}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  const mappedLang = LANGUAGE_MAP[targetLang] || "en";

  try {
    // Method 1: MyMemory API (free, 100 requests/day)
    const encodedText = encodeURIComponent(text.substring(0, 500)); // Limit length
    const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${mappedLang}`;

    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText;
      translationCache[cacheKey] = translated; // Cache the result
      return translated;
    }
    
    return text;
  } catch (error) {
    console.error("Translation error:", error);
    
    // Fallback: Return original text
    return text;
  }
};

export const translateMultiple = async (
  texts: string[],
  targetLang: string
): Promise<string[]> => {
  if (targetLang === "en") {
    return texts;
  }

  try {
    const translations: string[] = [];
    
    for (const text of texts) {
      const translated = await translateText(text, targetLang);
      translations.push(translated);
      
      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return translations;
  } catch (error) {
    console.error("Multiple translation error:", error);
    return texts;
  }
};

// Clear cache if needed (useful for debugging)
export const clearTranslationCache = () => {
  Object.keys(translationCache).forEach(key => {
    delete translationCache[key];
  });
};