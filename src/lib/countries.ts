export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
}

export const COUNTRIES: Country[] = [
  { code: "US", name: "United States", flag: "🇺🇸", currency: "USD" },
  { code: "CN", name: "China", flag: "🇨🇳", currency: "CNY" },
  { code: "JP", name: "Japan", flag: "🇯🇵", currency: "JPY" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳", currency: "USD" },
  { code: "DE", name: "Germany", flag: "🇩🇪", currency: "EUR" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", currency: "GBP" },
  { code: "IN", name: "India", flag: "🇮🇳", currency: "USD" },
  { code: "SG", name: "Singapore", flag: "🇸🇬", currency: "USD" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰", currency: "USD" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪", currency: "USD" },
];

export function findCountry(code: string): Country {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}
