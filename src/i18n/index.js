/**
 * Translations for the React booking shortcodes.
 *
 * Strings are managed in WordPress: FlexiBooking > Translation Management.
 * The plugin's V2 translation bridge prints the catalog for the page's
 * frontend language as `window.bmV2Translations` before this bundle runs.
 * When it is missing (local dev, page caches that drop inline scripts) the
 * same catalog is fetched from the public REST endpoint.
 *
 * Rules for translatable text (scripts/extract-i18n.mjs depends on them):
 *  - Pass string literals: __("Select date"), never __(variable).
 *  - Put values in with sprintf: sprintf(__("%s left"), count).
 *  - Use _n() for counts and _x() when the same word needs two translations.
 *  - Call these inside components/functions, not at module top level: they
 *    must run after initI18n() has loaded the catalog.
 */
import { createElement, Fragment } from "react";
import { createI18n, sprintf } from "@wordpress/i18n";

export const TEXT_DOMAIN = "service-booking";
const SOURCE_LOCALE = "en_US";
const FETCH_TIMEOUT_MS = 4000;

const i18n = createI18n(undefined, TEXT_DOMAIN);

let currentLocale = SOURCE_LOCALE;
let initPromise = null;

function applyCatalog(payload) {
  const data = payload?.locale_data?.[TEXT_DOMAIN];
  if (!data || typeof data !== "object") return false;
  // Own instance: resetting it never touches other plugins' wp.i18n data.
  i18n.resetLocaleData(data, TEXT_DOMAIN);
  currentLocale = payload.locale || data[""]?.lang || SOURCE_LOCALE;
  return true;
}

// VITE_API_URL points at booking/v1 ("/wp-json/booking/v1/" or a
// "?rest_route=/booking/v1" URL); the catalog lives in the same REST root.
function catalogUrl() {
  const api = String(import.meta.env.VITE_API_URL || "/wp-json/booking/v1/");
  const route = "/bm-translations/v1/frontend";
  if (api.includes("rest_route=")) {
    return api.replace(/rest_route=[^&]*/, `rest_route=${route}`);
  }
  const root = api.replace(/booking\/v1\/?$/, "").replace(/\/?$/, "");
  return `${root}${route}`;
}

async function fetchCatalog() {
  const controller =
    typeof AbortController === "function" ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    : null;
  try {
    const response = await fetch(catalogUrl(), {
      credentials: "same-origin", // sends the footer switcher's language cookie
      signal: controller?.signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return false;
    return applyCatalog(await response.json());
  } catch {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Load the catalog once. Always resolves; on any failure the UI stays in the
 * English source strings so a translation problem never blocks a booking.
 */
export function initI18n() {
  if (!initPromise) {
    initPromise = (async () => {
      if (typeof window !== "undefined" && applyCatalog(window.bmV2Translations)) {
        return currentLocale;
      }
      await fetchCatalog();
      return currentLocale;
    })();
  }
  return initPromise;
}

/** WordPress locale of the loaded catalog, e.g. "it_IT". */
export const getLocale = () => currentLocale;

/** CSS class for the page language, e.g. "fx-it" or "fx-en". */
export const getLanguageClass = () =>
  `fx-${currentLocale.split("_")[0].toLowerCase()}`;

/** BCP 47 tag for Intl / toLocaleDateString, e.g. "it-IT". */
export const getLanguageTag = () => currentLocale.replace(/_/g, "-");

// Languages Stripe Elements accepts; anything else makes it throw.
const STRIPE_LOCALES = new Set(
  "ar bg cs da de el en es et fi fil fr he hr hu id it ja ko lt lv ms mt nb nl pl pt ro ru sk sl sv th tr vi zh".split(" "),
);

/** Language for Stripe <Elements options={{ locale }}>: "it", or "auto". */
export const getStripeLocale = () => {
  const language = currentLocale.split("_")[0].toLowerCase();
  return STRIPE_LOCALES.has(language) ? language : "auto";
};

export const __ = (text) => i18n.__(text, TEXT_DOMAIN);
export const _x = (text, context) => i18n._x(text, context, TEXT_DOMAIN);
export const _n = (single, plural, number) =>
  i18n._n(single, plural, number, TEXT_DOMAIN);
export const _nx = (single, plural, number, context) =>
  i18n._nx(single, plural, number, context, TEXT_DOMAIN);

/**
 * Translate text that is not a literal in this codebase (e.g. default step
 * titles coming from shortcode attributes). It only translates when the
 * exact string is in the catalog, so it must also be listed in
 * src/i18n/extra-strings.js to be translatable.
 */
export const translateDynamic = (text) =>
  typeof text === "string" && text !== "" ? i18n.__(text, TEXT_DOMAIN) : text;

/**
 * Put React elements (links, bold values) inside a translated sentence, so
 * the sentence is translated whole instead of in fragments:
 *   withElement(__("Please accept %s before proceeding"), <a>…</a>)
 *   withElement(__("Code %1$s saves %2$s"), <strong>…</strong>, <span>…</span>)
 * "%s" takes the elements in order; "%1$s", "%2$s" pick one by position, so
 * translators can reorder them.
 */
export function withElement(translated, ...elements) {
  const parts = [];
  let next = 0;
  let last = 0;
  const placeholder = /%(?:(\d+)\$)?s/g;
  let match;
  while ((match = placeholder.exec(translated))) {
    const position = match[1] ? Number(match[1]) - 1 : next++;
    parts.push(translated.slice(last, match.index), elements[position] ?? "");
    last = match.index + match[0].length;
  }
  parts.push(translated.slice(last));
  // A translation that lost its placeholders still shows the elements.
  if (last === 0) parts.push(" ", ...elements);
  // Children passed as arguments (not an array) need no React keys.
  return createElement(Fragment, null, ...parts);
}

export { sprintf };
