import { useNavigation } from '@react-navigation/native';
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import Cart from '../assets/cart.png'
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../theme';

const CartIcon = () => {
  const navigation = useNavigation();
  const { reduxItems } = useSelector(state => state.cart); 
  // const itemCount = reduxItems.length;
  const itemCount = reduxItems ? Object.keys(reduxItems).length : 0;
console.log(reduxItems,"p")
  return (
    <TouchableOpacity style={styles.cartContainer} onPress={() => navigation.navigate('CartScreen')}>
      <View style={styles.iconWrapper}>
        {itemCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{itemCount}</Text> 
          </View>
       )}
      </View>
      <MaterialIcons name="shopping-cart" size={32} color={colors.text.onPrimary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cartContainer: {
    // marginRight: 20,
    alignItems: 'center', // Center the icon and label horizontally
  },
  iconWrapper: {
    position: 'relative', // To position the badge on top of the icon
  },
  badge: {
    position: 'absolute',
    right: -27, // Adjust positioning for the badge
    top: -3, // Adjust positioning for the badge
    backgroundColor: 'red', // Red badge background
    width: 18,
    height: 18,
    borderRadius: 13, // Circular badge
    justifyContent: 'center', // Center the number vertically
    alignItems: 'center', // Center the number horizontally
    elevation: 3, // Shadow effect for the badge
  },
  badgeText: {
    color: 'white', // White text inside the badge
    fontSize: 10, // Font size for the count
    fontWeight: 'bold', // Bold font for the count
  },
  cartText: {
    marginTop: 4, // Spacing between icon and label
    fontSize: 20, // Slightly larger font for the label
    color: 'red', // Mustard yellow for the label
    fontWeight: 'bold', // Bold font for the label
    textAlign: 'center', // Align the text to the center
  },
});

export default CartIcon;
