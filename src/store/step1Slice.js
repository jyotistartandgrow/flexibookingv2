import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  date: "",
  receiverInfo: {
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    country: "",
    state: "",
    city: "",
    zip: "",
    postcode: "",
    address: "",
  },
  step: "datestep",
  redeemstep: "codestep",
  couponcode: [],
  loading: false,
  category: "",
  gift: false,
  giftCustomization: {
    giftType: "New Year",
    template: "happy-new-year",
    message: "",
    font: "Roboto",
    delivery: "recipient",
    schedule: false,
    deliveryDate: "",
    deliveryTime: "",
  },
  all: false,
  voucher: null,
  stripe_key: null,
  topbar: false,
  opendatepurchase: false,
  redeemBooking: false,
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
    setRedeemStep: (state, action) => {
      state.redeemstep = action.payload;
    },
    setCouponlist: (state, action) => {
      state.couponcode = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setCategory: (state, action) => {
      state.category = action.payload;
    },
    setGift: (state, action) => {
      state.gift = action.payload;
    },
    setGiftCustomization: (state, action) => {
      state.giftCustomization = {
        ...state.giftCustomization,
        ...action.payload,
      };
    },
    setAll: (state, action) => {
      state.all = action.payload;
    },
    setVoucher: (state, action) => {
      state.voucher = action.payload;
    },
    setStripeKey: (state, action) => {
      state.stripe_key = action.payload;
    },
    setTopbar: (state, action) => {
      state.topbar = action.payload;
    },
    setOpenDatePurchase: (state, action) => {
      state.opendatepurchase = action.payload;
    },
    setRedeemBooking: (state, action) => {
      state.redeemBooking = action.payload;
    },
  },
});

export const {
  setDate,
  setReceiverInfo,
  setStep,
  setRedeemStep,
  setCouponlist,
  setLoading,
  setCategory,
  setGift,
  setGiftCustomization,
  setAll,
  setVoucher,
  setStripeKey,
  setTopbar,
  setOpenDatePurchase,
  setRedeemBooking,
} = step1Slice.actions;
export default step1Slice.reducer;
