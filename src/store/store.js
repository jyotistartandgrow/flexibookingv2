import { configureStore } from "@reduxjs/toolkit";
import step1Reducer from "./step1Slice";
import step2Reducer from "./step2Slice";
import step3Reducer from "./step3Slice";
import step4Reducer from "./step4Slice";

import { persistReducer, persistStore } from "redux-persist";
//import storage from "redux-persist/lib/storage"; // localStorage
import storageSession from "redux-persist/lib/storage/session"; // 👈 IMPORTANT
import { combineReducers } from "redux";

const persistConfig = {
  key: "root",
  storage: storageSession,
  // whitelist: ["step1"],  // optional → only persist selected slices
};

const appReducer = combineReducers({
  step1: step1Reducer,
  step2: step2Reducer,
  step3: step3Reducer,
  step4: step4Reducer,
});

// 🔹 Root reducer with RESET support
const rootReducer = (state, action) => {
  if (action.type === "app/reset") {
    // clear persisted storage
    storageSession.removeItem("persist:root");
    state = undefined; // 👈 resets ALL slices
  }
  return appReducer(state, action);
};

// 🔹 Persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // required for redux-persist
    }),
});

export const persistor = persistStore(store);
