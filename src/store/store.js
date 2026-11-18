import { configureStore } from "@reduxjs/toolkit";
import step1Reducer from "./step1Slice";
import step2Reducer from "./step2Slice";
import step3Reducer from "./step3Slice";
import step4Reducer from "./step4Slice";

import { persistReducer, persistStore } from "redux-persist";
import storageSession from "redux-persist/lib/storage/session"; // per-tab storage
import { combineReducers } from "redux";

// Every persisted booking store is saved under "persist:<PERSIST_PREFIX><key>".
export const PERSIST_PREFIX = "fx-";

const appReducer = combineReducers({
  step1: step1Reducer,
  step2: step2Reducer,
  step3: step3Reducer,
  step4: step4Reducer,
});

// Creates an isolated Redux store (and its sessionStorage entry) for one
// shortcode, so several shortcodes on the same page never share state.
export function createBookingStore(key) {
  const persistKey = `${PERSIST_PREFIX}${key}`;

  // Root reducer with RESET support
  const rootReducer = (state, action) => {
    if (action.type === "app/reset") {
      // clear this store's persisted copy only
      storageSession.removeItem(`persist:${persistKey}`);
      state = undefined; // resets ALL slices of this store
    }
    return appReducer(state, action);
  };

  const persistedReducer = persistReducer(
    { key: persistKey, storage: storageSession },
    rootReducer,
  );

  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // required for redux-persist
      }),
  });

  const persistor = persistStore(store);

  return { store, persistor };
}
