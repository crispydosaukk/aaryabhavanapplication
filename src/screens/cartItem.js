import React, { useState } from 'react';
import { Animated, TouchableOpacity, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import appTheme from '../abTheme';

const CartItem = ({ 
  item, 
  currentQuantity, 
  isUpdating, 
  onQuantityChange, 
  onRemove 
}) => {
  const [fadeAnim] = useState(new Animated.Value(1));

  const handleRemove = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onRemove(item);
    });
  };

  return (
    <Animated.View style={[styles.itemContainer, { opacity: fadeAnim }]}>
      <View style={styles.itemDetails}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          {item.itemType === 'derived' && (
            <View style={styles.derivedBadge}>
              <Text style={styles.derivedBadgeText}>Prepared</Text>
            </View>
          )}
        </View>
        <Text style={styles.itemBrand}>{item.brand || item.vendor || 'No brand'}</Text>
        <Text style={styles.itemStock}>
          Available: {item.availableQuantity} {item.units}
          {item.availableQuantity < 5 && (
            <Text style={styles.lowStock}> • Low Stock!</Text>
          )}
        </Text>
      </View>

      <View style={styles.rightContainer}>
        {isUpdating ? (
          <ActivityIndicator size="small" color={appTheme.colors.primary} />
        ) : (
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[styles.quantityButton, currentQuantity <= 1 && styles.quantityButtonDisabled]}
              onPress={() => onQuantityChange(item, 'decrease')}
              disabled={currentQuantity <= 1}>
              <Text style={styles.quantityButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{currentQuantity}</Text>
            <TouchableOpacity
              style={[styles.quantityButton, currentQuantity >= item.availableQuantity && styles.quantityButtonDisabled]}
              onPress={() => onQuantityChange(item, 'increase')}
              disabled={currentQuantity >= item.availableQuantity}>
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.removeButton}
          onPress={handleRemove}
          disabled={isUpdating}>
          <Icon 
            name="trash-can-outline" 
            size={24} 
            color={appTheme.colors.accent} 
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Copy all the relevant styles from your CartScreen styles
  // that are used by the CartItem component
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: appTheme.colors.white,
    borderRadius: appTheme.borderRadius.lg,
    marginBottom: 12,
    padding: 16,
    shadowColor: appTheme.colors.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
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
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderButtonText: {
    color: appTheme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
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
  // ... include all other necessary styles
});

export default CartItem;