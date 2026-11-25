import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.scss";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { createBookingStore, PERSIST_PREFIX } from "./store/store";
import { PersistorContext } from "./store/PersistorContext";
import { PersistGate } from "redux-persist/integration/react";
import { setGift, setOpenDatePurchase } from "./store/step1Slice";
import { initializeBookingNonce } from "./Utils/Interceptor";

// Shortcode container id -> initial route. Each one found on the page gets
// its own isolated store, saved as sessionStorage "persist:fx-<id>".
const SHORTCODES = [
  ["react_sgbm_starting_date", "/"],
  ["react_sgbm_starting_gift", "/?type=gift"],
  ["react_sgbm_starting_category", "/startingcategory"],
  ["react_sgbm_starting_service", "/startingservice"],
  ["react_sgbm_redeem_gift", "/redeemgift"],
  ["react_sgbm_open_date_purchase", "/opendatepurchase"],
  ["react_sgbm_checkin", "/checkin"],
  ["react_sgbm_widget", "/widget"],
  ["react_sgbm_single_service_open_calendar", "/ssopencalendar"],
  ["react_sgbm_single_service", "/singleservice"],
];

const FLOW_STORAGE_KEY = "fx-active-flow";
const LEGACY_PERSIST_KEY = "persist:root"; // single shared store (old builds)

// sessionStorage can throw (blocked storage, some private modes).
const storage = {
  get(key) {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      /* booking still works, it just won't survive a reload */
    }
  },
  removeBookingData() {
    try {
      Object.keys(sessionStorage)
        .filter(
          (key) =>
            key === LEGACY_PERSIST_KEY ||
            key.startsWith(`persist:${PERSIST_PREFIX}`),
        )
        .forEach((key) => sessionStorage.removeItem(key));
    } catch {
      /* nothing to clear */
    }
  },
};

// A "flow" is the set of shortcodes on the current page. Reloading the same
// page keeps every shortcode's booking; landing on a page with a different
// set of shortcodes starts all of them clean (same rule as before, but it no
// longer resets when two shortcodes share a page).
function ensureCleanSessionForPage(shortcodeIds) {
  const flowId = [...shortcodeIds].sort().join(",");
  const isNewSession = storage.get(FLOW_STORAGE_KEY) !== flowId;
  if (isNewSession) {
    storage.removeBookingData();
  }
  storage.set(FLOW_STORAGE_KEY, flowId);
  return isNewSession;
}

// Parse a JSON data-* attribute without letting one malformed shortcode
// attribute throw and abort mounting of every shortcode on the page.
function parseJsonAttr(value, fallback) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    console.error("Invalid JSON in booking shortcode attribute:", value);
    return fallback;
  }
}

// IDs from shortcode attributes end up in API query strings: only accept
// positive integers so values like "1&all=true" can't inject parameters.
const toPositiveId = (value, fallback = 0) =>
  /^[1-9][0-9]*$/.test(String(value ?? "").trim())
    ? String(value).trim()
    : fallback;

function mountAll() {
  // Start nonce loading once for all API requests made by this frontend.
  initializeBookingNonce().catch((error) => {
    console.error("Unable to initialize the booking API nonce.", error);
  });

  const present = SHORTCODES.filter(([id]) => document.getElementById(id));
  if (!present.length) return;

  // Skip shortcodes that are already mounted (WP can run this twice) so a
  // second pass can't wipe their saved bookings.
  const unmounted = present.filter(
    ([id]) => !document.getElementById(id).dataset.mounted,
  );
  if (!unmounted.length) return;

  const isNewSession = ensureCleanSessionForPage(present.map(([id]) => id));
  unmounted.forEach(([id, route]) => mountReactApp(id, route, isNewSession));
}

// The first shortcode that sets a secondary colour also sets it page-wide, so
// popups rendered outside the shortcode (sidebars, dialogs) use it too.
let pageSecondaryColorSet = false;

function mountReactApp(id, initialRoute, isNewSession) {
  const el = document.getElementById(id);

  // Prevent double mounting (important in WP).
  if (!el || el.dataset.mounted) return;
  el.dataset.mounted = "true";

  // Stale data was cleared before this point, so the store starts clean
  // unless this is a reload of the same page.
  const hasSavedBooking = Boolean(
    storage.get(`persist:${PERSIST_PREFIX}${id}`),
  );
  const { store, persistor } = createBookingStore(id);

  // Only seed the gift flag for a fresh session. On a reload of the same flow
  // the persisted value (e.g. the user switched to the Gift tab) must survive.
  if (isNewSession || !hasSavedBooking) {
    const isOpenDatePurchase = id === "react_sgbm_open_date_purchase";
    store.dispatch(
      setGift(id === "react_sgbm_starting_gift" || isOpenDatePurchase),
    );
    store.dispatch(setOpenDatePurchase(isOpenDatePurchase));
  }

  const props = {
    topbar: el.dataset.topbar || "true",
    rightbar: el.dataset.rightbar || "false",
    bottombar: el.dataset.bottombar || "false",
    mobileHeading: el.dataset.mobileHeading || "false",
    showBookNowButton: el.dataset.showBookNowButton || "false",
    calendarInfoVisibility: el.dataset.calendarInfoVisibility || "true",
    calendarInfo: el.dataset.calendarInfo || "price",
    service_id: toPositiveId(el.dataset.serviceId, 0),
    bundle_id: toPositiveId(el.dataset.bundleId, 0),
    virtual_service_id: toPositiveId(el.dataset.virtualServiceId, 0),
    categoryLabelVisibility: el.dataset.categoryLabelVisibility || "true",
    termsAndConditionLink: el.dataset.termsAndConditionLink || "",
    secondaryColor: el.dataset.secondaryColor,
    stepTitles: parseJsonAttr(el.dataset.stepTitles, {}),
    stepsVisibility: parseJsonAttr(el.dataset.stepsVisibility, {
      step_1_title_visible: "true",
      step_2_title_visible: "true",
      step_3_title_visible: "true",
      step_4_title_visible: "true",
      step_5_title_visible: "true",
    }),
    showPriceInDate: el.dataset.showPriceInDate || "true",
    showPrice: el.dataset.showPrice || "true",
    showDescription: el.dataset.showDescription || "true",
    showStepsAfterProceed: el.dataset.showStepsAfterProceed || "true",
    showProceedButton: el.dataset.showProceedButton || "true",
    showGiftButton: el.dataset.showGiftButton || "false",
    // data-hide-slotbar="true": no Morning / Afternoon / All tabs in the
    // service popup; all slots are listed.
    hideSlotbar: el.dataset.hideSlotbar || "false",
    serviceIds: (el.dataset.serviceIds || "")
      .split(",")
      .map((serviceId) => toPositiveId(serviceId, ""))
      .filter(Boolean),
  };

  // Secondary colour applies to this shortcode only (CSS variables inherit).
  if (props.secondaryColor) {
    el.style.setProperty("--fx-secondary-colors", props.secondaryColor);
    if (!pageSecondaryColorSet) {
      document.documentElement.style.setProperty(
        "--fx-secondary-colors",
        props.secondaryColor,
      );
      pageSecondaryColorSet = true;
    }
  }
console.log("Mounting booking shortcode", id, "with props:", props);
  createRoot(el).render(
    <StrictMode>
      <Provider store={store}>
        <PersistorContext.Provider value={persistor}>
          <PersistGate loading={null} persistor={persistor}>
            <App initialRoute={initialRoute} {...props} />
          </PersistGate>
        </PersistorContext.Provider>
      </Provider>
    </StrictMode>,
  );
}

// Keep this at the end of the file: it can run mountAll() immediately, so
// every top-level const/let above must already be initialised.
// Mount when the DOM is ready. If this script is injected after
// DOMContentLoaded already fired (lazy-loaded by WP/optimisers), mount now.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountAll);
} else {
  mountAll();
}
