import { describe, expect, it } from "vitest";
import { normalizeArabicQuery } from "@/lib/arabic-query";

describe("normalizeArabicQuery", () => {
  it("maps Adidas Samba", () => {
    expect(normalizeArabicQuery("اديداس سامبا")).toBe("adidas samba");
  });
  it("drops generic words and shoe type when a brand is present", () => {
    expect(normalizeArabicQuery("كوتشي اديداس رجالي")).toBe("adidas");
  });
  it("maps a shoe type", () => {
    expect(normalizeArabicQuery("كوتشي")).toBe("sneaker");
  });
  it("converts Arabic-Indic digits", () => {
    expect(normalizeArabicQuery("٤٢")).toBe("42");
  });
  it("preserves lower-case English", () => {
    expect(normalizeArabicQuery("nike")).toBe("nike");
  });
});
