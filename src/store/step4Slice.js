import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  checkoutkey: null,
  paymentstring: null,
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
    setSessionExpired: (state, action) => {
      state.session_expired = action.payload;
    },
  },
});

export const { setCheckoutkey, setPaymentstring, setSessionExpired } =
  step4Slice.actions;
export default step4Slice.reducer;
