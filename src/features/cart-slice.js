// cart-slice.js
import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    reduxItems: {},
  },
  reducers: {
    addItemToCart: (state, action) => {
      const { id, quantity } = action.payload;
      if (state.reduxItems[id]) {
        state.reduxItems[id].quantity = quantity;
      } else {
        state.reduxItems[id] = { ...action.payload, quantity };
      }
    },
    removeItemFromCart: (state, action) => {
      const id = action.payload;
      delete state.reduxItems[id];
    },
    setCartData(state, action) {
        state.reduxItems = action.payload; // Set cart state with loaded data
      },
  },
});

export const { addItemToCart, removeItemFromCart , setCartData  } = cartSlice.actions;
export default cartSlice.reducer;
