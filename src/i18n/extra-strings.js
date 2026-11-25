/**
 * Strings that reach the UI as data instead of as literals in a component,
 * listed here so scripts/extract-i18n.mjs puts them in the manifest.
 * At runtime they are translated with translateDynamic().
 *
 * Never called; it exists only for the extractor.
 */
import { __ } from "./index";

// eslint-disable-next-line no-unused-vars
function shortcodeDefaultStepTitles() {
  // Defaults from includes/class-react-shortcodes.php (step_titles).
  // A merchant-entered custom title is only translated if it is also added
  // here (or registered in Translation Management by other means).
  return [
    __("Book your Services"),
    __("What experience are you looking for?"),
    __("Checkout"),
    __("Redeem Your gift"),
    __("Select Date"),
    __("Select Slot Details"),
    __("Date"),
    __("Extra"),
    __("Payment"),
  ];
}
