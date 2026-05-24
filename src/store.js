// store.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './features/user-slice';
import cartReducer from './features/cart-slice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    cart: cartReducer,
  },
});
