import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.scss";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store, persistor } from "./store/store";
import { PersistGate } from "redux-persist/integration/react";

// function to mount to any ID
function mountReactApp(id, initialRoute) {
  const el = document.getElementById(id);
  if (el) {
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
}

// mount for shortcode 1
mountReactApp("react_sgbm_starting_date", "/");

// mount for shortcode 2
mountReactApp("react_sgbm_starting_gift", "/?type=gift");

// mount for shortcode 3
mountReactApp("react_sgbm_starting_category", "/startingcategory");

// mount for shortcode 4
mountReactApp("react_sgbm_starting_service", "/startingservice");
