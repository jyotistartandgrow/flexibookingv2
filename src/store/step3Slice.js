import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  extracapacity: 0,
  extra: null,
  bookingkey: null,
  slot: null,
  redeemBundleSlots: [],
  voucherdetail: {},
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
    setSlot: (state, action) => {
      state.slot = action.payload;
    },
    setRedeemBundleSlots: (state, action) => {
      state.redeemBundleSlots = action.payload;
    },
    setVoucherDetail: (state, action) => {
      state.voucherdetail = action.payload;
    },
  },
});

export const {
  setExtracapacity,
  setExtra,
  setBookingkey,
  setSlot,
  setRedeemBundleSlots,
  setVoucherDetail,
} = step3Slice.actions;
export default step3Slice.reducer;
