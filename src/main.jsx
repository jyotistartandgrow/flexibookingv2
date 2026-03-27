import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.scss";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store, persistor } from "./store/store";
import { PersistGate } from "redux-persist/integration/react";

// Mount React only when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  mountReactApp("react_sgbm_starting_date", "/");
  mountReactApp("react_sgbm_starting_gift", "/?type=gift");
  mountReactApp("react_sgbm_starting_category", "/startingcategory");
  mountReactApp("react_sgbm_starting_service", "/startingservice");
  mountReactApp("react_sgbm_redeem_gift", "/redeemgift");
});

function mountReactApp(id, initialRoute) {
  const el = document.getElementById(id);

  if (!el) return;

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
    stepsVisibility: el.dataset.stepsVisibility ? JSON.parse(el.dataset.stepsVisibility) : {},
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
          <App initialRoute={initialRoute} {...props} />
        </PersistGate>
      </Provider>
    </StrictMode>,
  );
}
