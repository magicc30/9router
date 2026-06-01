import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, LOCALES, isSupportedLocale, normalizeLocale } from "../../src/i18n/config.js";

describe("i18n locale config", () => {
  it("keeps every configured locale supported", () => {
    for (const locale of LOCALES) {
      expect(isSupportedLocale(locale)).toBe(true);
      expect(normalizeLocale(locale)).toBe(locale);
    }
  });

  it("normalizes common aliases and browser-style locale tags", () => {
    expect(normalizeLocale("zh")).toBe("zh-CN");
    expect(normalizeLocale("zh_CN")).toBe("zh-CN");
    expect(normalizeLocale("zh-cn")).toBe("zh-CN");
    expect(normalizeLocale("zh-Hans-CN")).toBe("zh-CN");
    expect(normalizeLocale("zh_Hant_TW")).toBe("zh-TW");
    expect(normalizeLocale("pt_br")).toBe("pt-BR");
    expect(normalizeLocale("pt-pt")).toBe("pt-PT");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("ja-JP")).toBe("ja");
  });

  it("falls back to default for unsupported, empty, or non-string values", () => {
    expect(normalizeLocale("xx-YY")).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale("")).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale(null)).toBe(DEFAULT_LOCALE);
    expect(normalizeLocale(undefined)).toBe(DEFAULT_LOCALE);
  });
});
