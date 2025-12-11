import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.scss";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./store/store";

// function to mount to any ID
function mountReactApp(id, initialRoute) {
  const el = document.getElementById(id);
  if (el) {
    createRoot(el).render(
      <StrictMode>
        <Provider store={store}>
          <App initialRoute={initialRoute} />
        </Provider>
      </StrictMode>
    );
  }
}

// mount for shortcode 1
mountReactApp("react_sgbm_starting_date", "/");

// mount for shortcode 2
mountReactApp("react_sgbm_starting_gift", "/?type=gift");
