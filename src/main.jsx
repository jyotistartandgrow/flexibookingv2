import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.scss";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store, persistor } from "./store/store";
import { PersistGate } from "redux-persist/integration/react";
import { setGift } from "./store/step1Slice";

const FLOW_STORAGE_KEY = "fx-active-flow";

function resetBookingSession() {
  store.dispatch({ type: "app/reset" });
  persistor.purge();
}

function ensureCleanSessionForFlow(flowId) {
  const previousFlow = sessionStorage.getItem(FLOW_STORAGE_KEY);

  // Always start with a clean booking session on first load and whenever flow changes.
  if (!previousFlow || previousFlow !== flowId) {
    resetBookingSession();
  }

  sessionStorage.setItem(FLOW_STORAGE_KEY, flowId);
}

// Mount React only when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const helpCenterRoute = "/help-center";

  mountReactApp("react_sgbm_starting_date", helpCenterRoute);
  mountReactApp("react_sgbm_starting_gift", helpCenterRoute);
  mountReactApp("react_sgbm_starting_category", "/help-center");
  mountReactApp("react_sgbm_starting_service", helpCenterRoute);
  mountReactApp("react_sgbm_redeem_gift", helpCenterRoute);
  mountReactApp("react_sgbm_open_date_purchase", helpCenterRoute);
  mountReactApp("react_sgbm_checkin", helpCenterRoute);
  mountReactApp("react_sgbm_widget", helpCenterRoute);
  mountReactApp("react_sgbm_help_center", helpCenterRoute);
});

function mountReactApp(id, initialRoute) {
  const el = document.getElementById(id);

  if (!el) return;

  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const localBrowserRoute = `${window.location.pathname}${window.location.search}`;

  const resolvedInitialRoute =
    el.dataset.initialRoute ||
    (isLocalhost && window.location.pathname !== "/" ? localBrowserRoute : initialRoute);

  ensureCleanSessionForFlow(id);
  store.dispatch(setGift(id === "react_sgbm_starting_gift"));

  console.log(el.dataset);
  // 👇 Get data attributes
  const props = {
    topbar: el.dataset.topbar || "true",
    rightbar: el.dataset.rightbar || "false",
    bottombar: el.dataset.bottombar || "false",
    mobileHeading: el.dataset.mobileHeading || "false",
    showBookNowButton: el.dataset.showBookNowButton || "false",
    calendarInfoVisibility: el.dataset.calendarInfoVisibility || "true",
    calendarInfo: el.dataset.calendarInfo || "price",
    categoryLabelVisibility: el.dataset.categoryLabelVisibility || "true",
    termsAndConditionLink: el.dataset.termsAndConditionLink || "",
    secondaryColor: el.dataset.secondaryColor,
    stepTitles: el.dataset.stepTitles ? JSON.parse(el.dataset.stepTitles) : {},
    stepsVisibility: el.dataset.stepsVisibility
      ? JSON.parse(el.dataset.stepsVisibility)
      : {
          step_1_title_visible: "true",
          step_2_title_visible: "true",
          step_3_title_visible: "true",
          step_4_title_visible: "true",
          step_5_title_visible: "true",
        },
  };

  // Set CSS custom property for secondary color
  if (props.secondaryColor) {
    document.documentElement.style.setProperty(
      "--fx-secondary-colors",
      props.secondaryColor,
    );
  }
  console.log("Props from data attributes:", props);
  // Prevent double mounting (important in WP)
  if (el.dataset.mounted) return;
  el.dataset.mounted = "true";

  createRoot(el).render(
    <StrictMode>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <App initialRoute={resolvedInitialRoute} {...props} />
        </PersistGate>
      </Provider>
    </StrictMode>,
  );
}
