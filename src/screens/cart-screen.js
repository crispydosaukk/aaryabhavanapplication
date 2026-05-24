import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  Image, 
  ActivityIndicator, 
  Animated, 
  SafeAreaView,
  Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
// import { firestore } from '../firebase-config';
import firestore from '@react-native-firebase/firestore';
import { addItemToCart, removeItemFromCart, setCartData } from '../features/cart-slice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import NetInfo from '@react-native-community/netinfo';
import appTheme from '../abTheme';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import CartItem from './cartItem';
import { useNavigation } from '@react-navigation/native';

const CartScreen = () => {
  const dispatch = useDispatch();
  const navigation= useNavigation()
  const { reduxItems } = useSelector(state => state.cart);
  const { user } = useSelector(state => state.user);
  const [cartItems, setCartItems] = useState([]);
  const [placeOrderClicked, setPlaceOrderClicked] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [totalAmount, setTotalAmount] = useState(0);
  const [isOrderingEnabled, setIsOrderingEnabled] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  useEffect(() => {
    const userCartRef = firestore().collection('userCart').doc(user.id);
    const cutoffTimeRef = firestore().collection('cutoffTime').doc('GCMLKWYcSCWKq0RvKrbB');
  
    const unsubscribeCart = userCartRef.onSnapshot(docSnapshot => {
      if (docSnapshot.exists) {
        const cartData = docSnapshot.data();
        const itemsArray = Object.values(cartData);
        setCartItems(itemsArray);
        calculateTotal(itemsArray);
        dispatch({ type: 'SET_CART', payload: cartData });
      }
    });
  
    const unsubscribeCutoff = cutoffTimeRef.onSnapshot(toggleDoc => {
      if (toggleDoc.exists) {
        setIsOrderingEnabled(toggleDoc.data().isCutoffEnabled);
      }
    });
  
    return () => {
      unsubscribeCart();
      unsubscribeCutoff();
    };
  }, []);
  

  // Fixed calculateTotal function to handle number conversion
  const calculateTotal = (items) => {
    const total = items.reduce((sum, item) => {
      // Ensure price is treated as a number
      const price = parseFloat(item.sellingPrice || item.price || 0);
      // Ensure quantity is treated as a number
      const quantity = parseInt(item.quantity || 0, 10);
      return sum + (price * quantity);
    }, 0);
    setTotalAmount(total);
  };

  // Update total whenever cartItems change
  useEffect(() => {
    calculateTotal(cartItems);
  }, [cartItems]);

  const updateFirestoreCart = async (updatedCart) => {
    try {
      const userCartRef = firestore().collection('userCart').doc(user.id);
      await userCartRef.set(updatedCart);
    } catch (error) {
      console.error('Error updating Firestore cart:', error);
      throw error;
    }
  };

  const handleQuantityChange = async (item, action) => {
    const currentQuantity = parseInt(reduxItems[item.id]?.quantity || 0, 10);
    const availableQuantity = parseInt(item.availableQuantity || 0, 10);
    let newQuantity = action === 'increase' ? currentQuantity + 1 : currentQuantity - 1;

    if (newQuantity > availableQuantity) {
      Alert.alert('Stock Limit', `Only ${availableQuantity} items available`);
      return;
    } else if (newQuantity < 0) {
      newQuantity = 0;
    }

    setUpdatingItemId(item.id);
    
    try {
      const updatedItem = {
        ...item,
        quantity: newQuantity,
        availableQuantity: availableQuantity - (newQuantity - currentQuantity)
      };

      const updatedCart = {
        ...reduxItems,
        [item.id]: updatedItem
      };

      // Update local state first
      const updatedItems = Object.values(updatedCart);
      setCartItems(updatedItems);
      dispatch(addItemToCart(updatedItem));

      // Update Firestore
      const batch = firestore().batch();
      const itemRef = firestore().collection(item.collection || 'inventoryItems').doc(item.refId);
      batch.update(itemRef, {
        availableQuantity: firestore.FieldValue.increment(-(newQuantity - currentQuantity)),
        soldQuantity: firestore.FieldValue.increment(newQuantity - currentQuantity)
      });

      const userCartRef = firestore().collection('userCart').doc(user.id);
      batch.set(userCartRef, updatedCart);

      await batch.commit();

    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update quantity. Please try again.');
      // Revert local changes
      const currentItems = Object.values(reduxItems);
      setCartItems(currentItems);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const removeFromCart = async (item) => {
    Alert.alert(
      'Remove Item',
      `Remove ${item.title} from cart?`,
      [
        { 
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setUpdatingItemId(item.id);
              
              // Create updated cart without the item
              const updatedCart = { ...reduxItems };
              delete updatedCart[item.id];
              
              // Update local state immediately
              const updatedItems = Object.values(updatedCart);
              setCartItems(updatedItems);
              dispatch(removeItemFromCart(item.id));
  
              // Update Firestore in batch
              const batch = firestore().batch();
              const itemRef = firestore()
                .collection(item.collection || 'inventoryItems')
                .doc(item.refId);
  
              batch.update(itemRef, {
                availableQuantity: firestore.FieldValue.increment(item.quantity),
                soldQuantity: firestore.FieldValue.increment(-item.quantity), // ✅ Decrease soldQuantity
              });
  
              const userCartRef = firestore().collection('userCart').doc(user.id);
              batch.set(userCartRef, updatedCart);
  
              await batch.commit();
  
            } catch (error) {
              console.error('Remove error:', error);
              Alert.alert('Error', 'Failed to remove item. Please try again.');
              
              // Revert local changes
              const currentItems = Object.values(reduxItems);
              setCartItems(currentItems);
            } finally {
              setUpdatingItemId(null);
            }
          },
        },
      ]
    );
  };
  

  const placeOrder = async () => {
    setPlaceOrderClicked(true);

    const state = await NetInfo.fetch();
    
    if (!isOrderingEnabled) {
      setPlaceOrderClicked(false);
      Alert.alert('Ordering Disabled', 'Ordering is currently disabled. Please try again later.');
      return;
    }

    if (!state.isConnected) {
      setPlaceOrderClicked(false);
      Alert.alert('No Connection', 'Please check your internet connection.');
      return;
    }

    if (cartItems.length === 0) {
      setPlaceOrderClicked(false);
      Alert.alert('Empty Cart', 'Please add items to your cart.');
      return;
    }

    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const ordersSnapshot = await firestore()
        .collection('invoices')
        .where('userId', '==', user.id)
        .where('createdAt', '>=', `${currentDate}T00:00:00.000Z`)
        .where('createdAt', '<=', `${currentDate}T23:59:59.999Z`)
        .get();

      let existingOrder = null;
      if (!ordersSnapshot.empty) {
        existingOrder = ordersSnapshot.docs[0];
      }

      const orderItems = cartItems.map(item => ({
        id: item.id,
        refId: item.refId,
        collection: item.collection,
        title: item.title,
        brand: item.brand || item.vendor,
        price: item.sellingPrice ?? item.price ?? 0,
        quantity: item.quantity,
        units: item.units,
        itemType: item.itemType,
        ingredients: item.ingredients || [],
        availableQuantityAtOrder: item.availableQuantity,
        categoryId: item.categoryId
      }));

      if (existingOrder) {
        const existingOrderData = existingOrder.data();
        const updatedItems = [...existingOrderData.items, ...orderItems];
        const updatedTotalPrice = updatedItems.reduce(
          (total, item) => total + (item.price * item.quantity), 0
        );

        await firestore().collection('invoices').doc(existingOrder.id).update({
          items: updatedItems,
          totalPrice: updatedTotalPrice,
          updatedAt: new Date().toISOString(),
        });

        Alert.alert('Success', 'Your order has been updated!');
      } else {
        const invoiceData = {
          userId: user.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          name: user.name,
          restaurantName: user.restaurantName,
          email: user.email,
          phone: user.phone,
          address: user.address,
          items: orderItems, // Using the new structure above
          orderStatus: 'pending',
          deliveryCharges: 0,
          tax: 0,
          totalPrice: totalAmount,
          // Optional metadata:
          originalCart: cartItems, // Full cart snapshot if needed
          cutoffTimeEnabled: isOrderingEnabled // For audit
        };
        console.log(JSON.stringify(invoiceData),"its invioice data")
        await firestore().collection('invoices').add(invoiceData);
        Alert.alert('Success', 'Your order has been placed!');
      }

      // Clear cart after successful order
      dispatch(setCartData({}));
      await firestore().collection('userCart').doc(user.id).delete();
      setCartItems([]);

    } catch (error) {
      console.error('Order error:', error);
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setPlaceOrderClicked(false);
    }
  };

  const renderItem = ({ item }) => {
    const currentQuantity = parseInt(reduxItems[item.id]?.quantity || 0, 10);
    const isUpdating = updatingItemId === item.id;

    const handleRemove = () => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        removeFromCart(item);
      });
    };

    return (
      <CartItem
      item={item}
      currentQuantity={currentQuantity}
      isUpdating={isUpdating}
      onQuantityChange={handleQuantityChange}
      onRemove={removeFromCart}
    />
    );
  };

  const CartHeader = () => (
    <LinearGradient
      colors={[appTheme.colors.primary, appTheme.colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      
    >
      <View style={{flexDirection:'row'}}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={{paddingLeft:10,paddingTop:15}}>
                {/* <Text style={{fontSize:20,paddingLeft:10}}>back</Text> */}
                <MaterialIcons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
      <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Your Cart</Text>
      <Text style={styles.itemCount}>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</Text>
      </View>
      </View>
    </LinearGradient>
  );

  const CartFooter = () => (
    <View style={styles.footerContainer}>
      <View style={styles.totalContainer}>
        {/* <Text style={styles.totalLabel}>Total Amount:</Text> */}
        {/* <Text style={styles.totalAmount}>₹{totalAmount.toFixed(2)}</Text> */}
      </View>
      
      {cartItems.length > 0 && (
        <TouchableOpacity
          style={styles.placeOrderButton}
          onPress={placeOrder}
          disabled={placeOrderClicked}>
          <LinearGradient
            colors={[appTheme.colors.primary, appTheme.colors.secondary]}
            style={[styles.placeOrderGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {placeOrderClicked ? (
              <ActivityIndicator size="small" color={appTheme.colors.white} />
            ) : (
              <Text style={styles.placeOrderButtonText}>Place Order</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <CartHeader />
      <FlatList
        data={cartItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={() => (
          <View style={styles.emptyCartContainer}>
            <Icon name="cart-off" size={48} color={appTheme.colors.dark + '50'} />
            <Text style={styles.emptyCartText}>Your cart is empty</Text>
            <Text style={styles.emptyCartSubtext}>Add items to get started</Text>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
        extraData={cartItems} // Ensure re-render when cartItems changes
      />
      <CartFooter />
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.pastelCream,
  },
  headerContainer: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    ...appTheme.shadows.medium,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: appTheme.colors.white,
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 16,
    color: appTheme.colors.white + 'CC',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: appTheme.colors.white,
    borderRadius: appTheme.borderRadius.lg,
    marginBottom: 12,
    padding: 16,
    ...appTheme.shadows.small,
  },
  itemDetails: {
    flex: 1,
    marginRight: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: appTheme.colors.dark,
    marginRight: 8,
  },
  derivedBadge: {
    backgroundColor: appTheme.colors.pastelPeach,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  derivedBadgeText: {
    fontSize: 12,
    color: appTheme.colors.secondary,
    fontWeight: 'bold',
  },
  itemBrand: {
    fontSize: 14,
    color: appTheme.colors.dark + '80',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '500',
    color: appTheme.colors.primary,
    marginBottom: 4,
  },
  itemStock: {
    fontSize: 14,
    color: appTheme.colors.dark + '80',
  },
  lowStock: {
    color: appTheme.colors.accent,
    fontWeight: 'bold',
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.colors.pastelGreen,
    borderRadius: appTheme.borderRadius.md,
    padding: 4,
    ...appTheme.shadows.small,
  },
  quantityButton: {
    backgroundColor: appTheme.colors.primary,
    borderRadius: 6,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: appTheme.colors.pastelPink,
  },
  quantityButtonText: {
    fontSize: 18,
    color: appTheme.colors.white,
    fontWeight: '600',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 12,
    color: appTheme.colors.dark,
  },
  removeButton: {
    padding: 8,
    marginTop: 8,
  },
  footerContainer: {
    backgroundColor: appTheme.colors.white,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.pastelGreen,
    ...appTheme.shadows.medium,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: appTheme.colors.dark,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: appTheme.colors.primary,
  },
  placeOrderButton: {
    borderRadius: appTheme.borderRadius.lg,
    overflow: 'hidden',
    ...appTheme.shadows.small,
  },
  placeOrderGradient: {
    // padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderButtonText: {
    color: appTheme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    height:50,
    padding: 12,
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyCartText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: appTheme.colors.dark,
    marginBottom: 8,
  },
  emptyCartSubtext: {
    fontSize: 16,
    color: appTheme.colors.dark + '80',
  },
});

export default CartScreen;