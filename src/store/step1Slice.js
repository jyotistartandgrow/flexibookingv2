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
  couponcode: [],
  loading: false,
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
    setCouponlist: (state, action) => {
      state.couponcode = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setDate, setReceiverInfo, setStep, setCouponlist, setLoading } =
  step1Slice.actions;
export default step1Slice.reducer;
