import * as countries from "i18n-iso-countries";
import ko from "i18n-iso-countries/langs/ko.json";

countries.registerLocale(ko);

export interface Country {
  code: string;
  name: string;
}

export const COUNTRIES: Country[] = Object.entries(countries.getNames("ko"))
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name, "ko"));

export function findCountry(code: string): Country {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}
