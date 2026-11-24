import { useSelector } from "react-redux";

/**
 * Site regional preferences from /settings (regional_preferences):
 * country, timezone, currency and default_phone_country.
 * Codes are normalised: country upper-case (e.g. "IT"), phoneCountry
 * lower-case for react-phone-input-2 (e.g. "it"). Empty until settings load.
 */
export function useRegionalPreferences() {
  const prefs = useSelector((state) => state.step1.regionalPreferences);
  const country = String(prefs?.country || "")
    .trim()
    .toUpperCase();
  return {
    loaded: Boolean(prefs),
    country,
    phoneCountry: String(prefs?.default_phone_country || country)
      .trim()
      .toLowerCase(),
    timezone: String(prefs?.timezone || ""),
    currency: String(prefs?.currency || ""),
  };
}
