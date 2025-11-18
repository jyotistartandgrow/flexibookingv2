import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  extracapacity: 0,
  extra: null,
  bookingkey: null,
};

const step3Slice = createSlice({
  name: "step3",
  initialState,
  reducers: {
    setExtracapacity: (state, action) => {
      state.extracapacity = action.payload;
    },
    setExtra: (state, action) => {
      state.extra = action.payload;
    },
    setBookingkey: (state, action) => {
      state.bookingkey = action.payload;
    },
  },
});

export const { setExtracapacity, setExtra, setBookingkey } = step3Slice.actions;
export default step3Slice.reducer;
