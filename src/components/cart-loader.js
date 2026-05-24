// src/components/CartLoader.js
import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCartData } from '../features/cart-slice';

const CartLoader = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const loadCartData = async () => {
      try {
        const cartData = await AsyncStorage.getItem('cart');
        if (cartData) {
            console.log(cartData)
          dispatch(setCartData(JSON.parse(cartData))); // Dispatch to set cart state
        }
      } catch (error) {
        console.error('Failed to load cart data from local storage:', error);
      }
    };

    loadCartData();
  }, [dispatch]);

  return null; // No UI needed, just side effect of loading cart data
};

export default CartLoader;
