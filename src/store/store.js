import { configureStore } from "@reduxjs/toolkit";
import step1Reducer from "./step1Slice";
import step2Reducer from "./step2Slice";
import step3Reducer from "./step3Slice";
import step4Reducer from "./step4Slice";

export const store = configureStore({
  reducer: {
    step1: step1Reducer, // Add all slices here
    step2: step2Reducer,
    step3: step3Reducer,
    step4: step4Reducer,
  },
});
