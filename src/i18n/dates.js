import moment from "moment";
import { __, getLanguageTag } from "./index";

const isEnglish = (tag) => /^en(-|$)/i.test(tag);

let namesCache = null;

/**
 * Month/day names for the page language from the browser's Intl data, so
 * every language enabled in WordPress works without shipping locale files.
 * Weekday arrays start on Sunday (moment and PrimeReact both expect that).
 * Returns null for English or when the browser cannot format the language.
 */
function localizedNames() {
  const tag = getLanguageTag();
  if (namesCache?.tag === tag) return namesCache.names;
  let names = null;
  if (!isEnglish(tag) && typeof Intl !== "undefined") {
    try {
      const list = (option, dates) => {
        const format = new Intl.DateTimeFormat(tag, { ...option, timeZone: "UTC" });
        return dates.map((date) => format.format(date));
      };
      const stripDot = (items) => items.map((name) => name.replace(/\.$/, ""));
      const months = Array.from({ length: 12 }, (_, m) => new Date(Date.UTC(2021, m, 15)));
      // 3 Jan 2021 was a Sunday.
      const days = Array.from({ length: 7 }, (_, d) => new Date(Date.UTC(2021, 0, 3 + d)));
      names = {
        months: list({ month: "long" }, months),
        monthsShort: stripDot(list({ month: "short" }, months)),
        weekdays: list({ weekday: "long" }, days),
        weekdaysShort: stripDot(list({ weekday: "short" }, days)),
        weekdaysMin: stripDot(list({ weekday: "narrow" }, days)),
      };
    } catch {
      names = null; // unsupported tag in this browser: keep English
    }
  }
  namesCache = { tag, names };
  return names;
}

/**
 * Make moment's month/day names follow the page language, e.g.
 * moment(date).format("MMM DD") -> "gen 05" in Italian. Format patterns stay
 * as written in the components; only the names change.
 */
export function applyMomentLocale() {
  const names = localizedNames();
  if (!names) return;
  const id = `fx-${getLanguageTag().toLowerCase()}`;
  // English ordinals ("5th") make no sense in other languages: plain number.
  const config = { parentLocale: "en", ...names, ordinal: (n) => String(n) };
  if (moment.locales().includes(id)) moment.updateLocale(id, config);
  else moment.defineLocale(id, config); // defineLocale also activates it
  moment.locale(id);
}

/**
 * Options for PrimeReact addLocale(): translated month/day names plus the
 * picker's button labels. Empty for English (PrimeReact defaults apply).
 */
export function calendarLocaleOptions() {
  const names = localizedNames();
  if (!names) return {};
  return {
    dayNames: names.weekdays,
    dayNamesShort: names.weekdaysShort,
    dayNamesMin: names.weekdaysMin,
    monthNames: names.months,
    monthNamesShort: names.monthsShort,
    today: __("Today"),
    clear: __("Clear"),
    weekHeader: __("Wk"),
    chooseDate: __("Choose Date"),
    prevMonth: __("Previous Month"),
    nextMonth: __("Next Month"),
  };
}
