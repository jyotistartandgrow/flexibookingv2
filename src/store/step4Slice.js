import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  checkoutkey: null,
  paymentstring: null,
  selectedPaymentMethod: null,
  session_expired: false,
};

const step4Slice = createSlice({
  name: "step4",
  initialState,
  reducers: {
    setCheckoutkey: (state, action) => {
      state.checkoutkey = action.payload;
    },
    setPaymentstring: (state, action) => {
      state.paymentstring = action.payload;
    },
    setSelectedPaymentMethod: (state, action) => {
      state.selectedPaymentMethod = action.payload;
    },
    setSessionExpired: (state, action) => {
      state.session_expired = action.payload;
    },
    sessionClear: (state) => {
      state.checkoutkey = null;
      state.paymentstring = null;
      state.selectedPaymentMethod = null;
      state.session_expired = false;
      state.bookingkey = null;
    },
  },
});

export const {
  setCheckoutkey,
  setPaymentstring,
  setSelectedPaymentMethod,
  setSessionExpired,
  sessionClear,
} = step4Slice.actions;
export default step4Slice.reducer;
