import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  checkoutkey: null,
  paymentstring: null,
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
  },
});

export const { setCheckoutkey, setPaymentstring } = step4Slice.actions;
export default step4Slice.reducer;
