import { configureStore } from "@reduxjs/toolkit";
import step1Reducer from "./step1Slice";

export const store = configureStore({
  reducer: {
    step1: step1Reducer, // Add all slices here
  },
});
