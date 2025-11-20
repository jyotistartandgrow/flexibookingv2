import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  date: "",
  receiverInfo: {
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    country: "",
    zip: "",
    address: "",
  },
  step: "datestep",
};

const step1Slice = createSlice({
  name: "step1",
  initialState,
  reducers: {
    setDate: (state, action) => {
      state.date = action.payload;
    },
    setReceiverInfo: (state, action) => {
      state.receiverInfo = { ...state.receiverInfo, ...action.payload };
    },
    setStep: (state, action) => {
      state.step = action.payload;
    },
  },
});

export const { setDate, setReceiverInfo, setStep } = step1Slice.actions;
export default step1Slice.reducer;
