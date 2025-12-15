import { configureStore } from "@reduxjs/toolkit";
import step1Reducer from "./step1Slice";
import step2Reducer from "./step2Slice";
import step3Reducer from "./step3Slice";
import step4Reducer from "./step4Slice";

import { persistReducer, persistStore } from "redux-persist";
import storage from "redux-persist/lib/storage"; // localStorage
import { combineReducers } from "redux";

const persistConfig = {
  key: "root",
  storage,
  // whitelist: ["step1"],  // optional → only persist selected slices
};

const rootReducer = combineReducers({
  step1: step1Reducer,
  step2: step2Reducer,
  step3: step3Reducer,
  step4: step4Reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // required for redux-persist
    }),
});

export const persistor = persistStore(store);
