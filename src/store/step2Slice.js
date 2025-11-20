import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  slot: "",
  capacity: 0,
  service: null,
  cart: [],
};

const step2Slice = createSlice({
  name: "step2",
  initialState,
  reducers: {
    setTimeslot: (state, action) => {
      state.slot = action.payload;
    },
    setCapacity: (state, action) => {
      state.capacity = action.payload;
    },
    setService: (state, action) => {
      state.service = action.payload;
    },
    setCart: (state, action) => {
      state.cart = action.payload;
    },
  },
});

export const { setTimeslot, setCapacity, setService, setCart } =
  step2Slice.actions;
export default step2Slice.reducer;
