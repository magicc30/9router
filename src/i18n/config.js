export const LOCALES = ["en", "vi", "zh-CN", "zh-TW", "ja", "pt-BR", "pt-PT", "ko", "es", "de", "fr", "he", "ar", "ru", "pl", "cs", "nl", "tr", "uk", "tl", "id", "th", "hi", "bn", "ur", "ro", "sv", "it", "el", "hu", "fi", "da", "no"];
export const DEFAULT_LOCALE = "en";
export const LOCALE_COOKIE = "locale";

export const LOCALE_NAMES = {
  "en": "English",
  "vi": "Tiếng Việt",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  "ja": "日本語",
  "pt-BR": "Português (Brasil)",
  "pt-PT": "Português (Portugal)",
  "ko": "한국어",
  "es": "Español",
  "de": "Deutsch",
  "fr": "Français",
  "he": "עברית",
  "ar": "العربية",
  "ru": "Русский",
  "pl": "Polski",
  "cs": "Čeština",
  "nl": "Nederlands",
  "tr": "Türkçe",
  "uk": "Українська",
  "tl": "Tagalog",
  "id": "Indonesia",
  "th": "ไทย",
  "hi": "हिन्दी",
  "bn": "বাংলা",
  "ur": "اردو",
  "ro": "Română",
  "sv": "Svenska",
  "it": "Italiano",
  "el": "Ελληνικά",
  "hu": "Magyar",
  "fi": "Suomi",
  "da": "Dansk",
  "no": "Norsk"
};

const LOCALE_LOOKUP = new Map(LOCALES.map((locale) => [locale.toLowerCase(), locale]));

const LOCALE_ALIASES = {
  zh: "zh-CN",
  "zh-hans": "zh-CN",
  "zh-hans-cn": "zh-CN",
  "zh-cn": "zh-CN",
  "zh-sg": "zh-CN",
  "zh-hant": "zh-TW",
  "zh-hant-tw": "zh-TW",
  "zh-tw": "zh-TW",
  "zh-hk": "zh-TW",
  "zh-mo": "zh-TW",
};

export function normalizeLocale(locale) {
  if (typeof locale !== "string") {
    return DEFAULT_LOCALE;
  }

  const normalized = locale.trim().replaceAll("_", "-").toLowerCase();
  if (!normalized) {
    return DEFAULT_LOCALE;
  }

  if (LOCALE_ALIASES[normalized]) {
    return LOCALE_ALIASES[normalized];
  }

  if (LOCALE_LOOKUP.has(normalized)) {
    return LOCALE_LOOKUP.get(normalized);
  }

  const [language] = normalized.split("-");
  if (LOCALE_ALIASES[language]) {
    return LOCALE_ALIASES[language];
  }
  if (LOCALE_LOOKUP.has(language)) {
    return LOCALE_LOOKUP.get(language);
  }

  return DEFAULT_LOCALE;
}

export function isSupportedLocale(locale) {
  return LOCALES.includes(locale);
}
