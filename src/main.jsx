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

  // Prevent double mounting (important in WP)
  if (el.dataset.mounted) return;
  el.dataset.mounted = "true";

  createRoot(el).render(
    <StrictMode>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <App initialRoute={initialRoute} />
        </PersistGate>
      </Provider>
    </StrictMode>
  );
}
