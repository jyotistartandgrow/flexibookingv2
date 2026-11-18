import { createContext, useContext } from "react";

// Each mounted shortcode has its own redux-persist persistor; components that
// need it (e.g. to purge the session) read it from here instead of importing
// a global singleton.
export const PersistorContext = createContext(null);

export const usePersistor = () => useContext(PersistorContext);
