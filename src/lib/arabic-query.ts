const DIGITS: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};

const PHRASES: Record<string, string> = {
  "ستان سميث": "stan smith",
  "اير فورس": "air force",
  "نيو بالانس": "new balance",
};

const TOKENS: Record<string, string> = {
  اديداس: "adidas",
  أديداس: "adidas",
  نايك: "nike",
  نايكي: "nike",
  بوما: "puma",
  اسكيتشرز: "skechers",
  سكيتشرز: "skechers",
  اسيكس: "asics",
  كروكس: "crocs",
  ريبوك: "reebok",
  فانز: "vans",
  كونفرس: "converse",
  سامبا: "samba",
  كامبس: "campus",
  كامبوس: "campus",
  جازيل: "gazelle",
  سوبرستار: "superstar",
  ييزي: "yeezy",
  ايرماكس: "air max",
  كوتشي: "sneaker",
  كوتشيهات: "sneaker",
  سنيكرز: "sneaker",
  صندل: "sandal",
  صنادل: "sandal",
  شبشب: "slide",
  شباشب: "slide",
  بوت: "boot",
  بوتات: "boot",
  جري: "running",
  كلوج: "clog",
  كلوجز: "clog",
};

const GENERIC = new Set(["رجالي", "حريمي", "ولادي", "بناتي", "جديد"]);
const BRAND_OR_MODEL = new Set([
  "adidas",
  "nike",
  "puma",
  "skechers",
  "asics",
  "crocs",
  "reebok",
  "vans",
  "converse",
  "new balance",
  "samba",
  "campus",
  "gazelle",
  "superstar",
  "stan smith",
  "yeezy",
  "air force",
  "air max",
  "new",
  "balance",
  "stan",
  "smith",
  "air",
  "force",
]);
const TYPES = new Set(["sneaker", "sandal", "slide", "boot", "running", "clog"]);

export function normalizeArabicQuery(input: string): string {
  let normalized = input.trim();
  normalized = normalized.replace(/[٠-٩]/g, (digit) => DIGITS[digit] ?? digit);
  normalized = normalized
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .toLowerCase();

  for (const [phrase, english] of Object.entries(PHRASES)) {
    normalized = normalized.replace(new RegExp(phrase, "g"), english);
  }

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const translated: string[] = [];
  for (let index = 0; index < tokens.length; index += 1) {
    const pair = `${tokens[index]} ${tokens[index + 1] ?? ""}`;
    if (pair === "نيو بالانس") {
      translated.push("new balance");
      index += 1;
      continue;
    }
    const token = tokens[index];
    if (!token || GENERIC.has(token)) continue;
    translated.push(TOKENS[token] ?? token);
  }

  const result = translated.join(" ");
  const resultTokens = result.split(/\s+/).filter(Boolean);
  const hasBrandOrModel = resultTokens.some((token) => BRAND_OR_MODEL.has(token));
  if (hasBrandOrModel) {
    return resultTokens.filter((token) => !TYPES.has(token)).join(" ");
  }
  return resultTokens.join(" ");
}
