import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet
} from 'react-native';
// import { firestore } from '../firebase-config';
import firestore from '@react-native-firebase/firestore';
import { useDispatch, useSelector } from 'react-redux';
import { addItemToCart, removeItemFromCart } from '../features/cart-slice';
import Toast from '../components/toast';
import appTheme from '../abTheme';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Icon2 from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const CategoryItem = memo(({ item, onQuantityChange, cartItem }) => {
  const currentQuantity = cartItem?.quantity || 0;
  const isDerived = item.itemType === 'derived';
  const price = item.sellingPrice || item.price || 0;
  const [expanded, setExpanded] = useState(false);
  const [loadingItemId, setLoadingItemId] = useState(null);
  const [isAddLoading, setIsAddLoading] = useState(false);

  const isItemLoading = loadingItemId === item.id;

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <View style={styles.itemContainer}>
      <View style={styles.itemDetails}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          {isDerived && (
            <View style={styles.derivedBadge}>
              <Text style={styles.derivedBadgeText}>Prepared</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.itemBrand}>{item.brand || item.vendor || 'No brand'}</Text>
        
        {/* {isDerived && item.ingredients?.length > 0 && (
          <TouchableOpacity onPress={toggleExpand} activeOpacity={0.8}>
            <View style={styles.ingredientsHeader}>
              <Text style={styles.ingredientsTitle}>
                Ingredients ({item.ingredients.length})
              </Text>
              <Icon 
                name={expanded ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={appTheme.colors.dark + '80'} 
              />
            </View>
            {expanded && (
              <View style={styles.ingredientsList}>
                {item.ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <Text style={styles.ingredientName}>
                      • {ingredient.title}
                    </Text>
                    <Text style={styles.ingredientQuantity}>
                      {ingredient.quantityPerUnit} {ingredient.units} per unit
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        )} */}

        <View style={styles.itemStats}>
          <Text style={styles.itemAvailable}>
            Available: {item.availableQuantity} {item.units}
          </Text>
          {/* <Text style={styles.itemPrice}>₹{price.toFixed(2)}</Text> */}
        </View>

        {item.availableQuantity < 5 && (
          <Text style={styles.lowStock}>Low Stock!</Text>
        )}
      </View>

      <View style={styles.quantityControls}>
        {currentQuantity === 0 ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              onQuantityChange(item, 'increase')
            }}
            disabled={isAddLoading} // Disable button during loading
          >
            {isAddLoading && isItemLoading ? (
              <ActivityIndicator size="small" color={appTheme.colors.white} />
            ) : (
              <LinearGradient
                colors={[appTheme.colors.secondary, appTheme.colors.secondary]}
                
              >
                <View style={[styles.addButtonGradient]}>
                <Icon name="cart-plus" size={20} color={appTheme.colors.white} />
                <Text style={styles.addButtonText}>Add</Text>
                </View>
              </LinearGradient>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.quantityWrapper}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => onQuantityChange(item, 'decrease')}
              disabled={isAddLoading}
            >
              {isAddLoading ? (
                <ActivityIndicator size="small" color={appTheme.colors.white} />
              ) : (
                <Text style={styles.quantityButtonText}>−</Text>
              )}
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>
              {isAddLoading ? (
                <ActivityIndicator size="small" color={appTheme.colors.primary} />
              ) : (
                currentQuantity
              )}
            </Text>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => onQuantityChange(item, 'increase')}
              disabled={isAddLoading}
            >
              {isAddLoading ? (
                <ActivityIndicator size="small" color={appTheme.colors.white} />
              ) : (
                <Text style={styles.quantityButtonText}>+</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
});

const CategoryItemsScreen = ({ route }) => {
  const { categoryId, categoryName } = route.params;
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useSelector(state => state.user);
  const { reduxItems } = useSelector(state => state.cart);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const userId = user.id;
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const flatListRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const cartItemsCount = Object.values(reduxItems).reduce(
    (sum, item) => sum + (item.quantity || 0),
    0
  );

  useEffect(() => {
    const fetchItems = async () => {
      try {
        // Fetch inventory items
        const inventoryItemsQuery = firestore()
          .collection('inventoryItems')
          .where('categoryId', '==', categoryId);

        // Fetch ingredients with showInMobile: true
        const ingredientsQuery = firestore()
          .collection('ingredients')
          .where('categoryId', '==', categoryId)
          .where('showInMobile', '==', true);

        const [inventorySnapshot, ingredientsSnapshot] = await Promise.all([
          inventoryItemsQuery.get(),
          ingredientsQuery.get()
        ]);

        const combinedItems = [];

        // Process inventory items (show all)
        if (!inventorySnapshot.empty) {
          inventorySnapshot.forEach(doc => {
            combinedItems.push({
              refId: doc.id,
              collection: 'inventoryItems',
              ...doc.data()
            });
          });
        }

        // Process ingredients (only showInMobile: true)
        if (!ingredientsSnapshot.empty) {
          ingredientsSnapshot.forEach(doc => {
            combinedItems.push({
              refId: doc.id,
              collection: 'ingredients',
              ...doc.data()
            });
          });
        }

        if (combinedItems.length === 0) {
          showToast('No items found for this category');
        }

        setItems(combinedItems);
      } catch (error) {
        console.error('Error fetching items:', error);
        showToast('Failed to fetch items. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [categoryId]);

  const showToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
  };

  const filteredItems = React.useMemo(() => 
    items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [items, searchQuery]
  );

  const handleQuantityChange = useCallback(async (item, action) => {
    const currentQuantity = reduxItems[item.id]?.quantity || 0;
    const availableQuantity = item.availableQuantity;
  
    let newQuantity = action === 'increase' ? currentQuantity + 1 : currentQuantity - 1;
  
    // Validate quantity bounds
    if (newQuantity > availableQuantity) {
      showToast('Maximum available quantity reached');
      return;
    } else if (newQuantity < 0) {
      newQuantity = 0;
    }
  
    const delta = newQuantity - currentQuantity;
    const updatedAvailableQuantity = availableQuantity - delta;
  
    try {
      // Firestore batch update
      const batch = firestore().batch();
      const itemRef = firestore().collection(item.collection).doc(item.refId);
  
      batch.update(itemRef, {
        availableQuantity: updatedAvailableQuantity,
        soldQuantity: firestore.FieldValue.increment(delta),
      });
  
      await batch.commit();
  
      // Update local item list state
      setItems(prevItems =>
        prevItems.map(i =>
          i.id === item.id
            ? {
                ...i,
                availableQuantity: updatedAvailableQuantity,
                soldQuantity: (i.soldQuantity || 0) + delta,
              }
            : i
        )
      );
  
      // Update Redux cart state
      if (newQuantity === 0) {
        dispatch(removeItemFromCart(item.id));
      } else {
        dispatch(
          addItemToCart({
            ...item,
            quantity: newQuantity,
            availableQuantity: updatedAvailableQuantity,
          })
        );
      }
  
      // Build updated cart object
      const updatedCart = { ...reduxItems };
      if (newQuantity === 0) {
        delete updatedCart[item.id];
      } else {
        updatedCart[item.id] = {
          ...item,
          quantity: newQuantity,
          availableQuantity: updatedAvailableQuantity,
        };
      }
  
      // Update Firestore user cart
      await firestore().collection('userCart').doc(userId).set(updatedCart);
  
      // Show appropriate toast
      if (newQuantity === 1 && action === 'increase') {
        showToast('Item added to cart!');
      } else if (newQuantity === 0 && action === 'decrease') {
        showToast('Item removed from cart.');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      showToast('Failed to update quantity. Please try again.');
    }
  }, [reduxItems, dispatch, userId]);
  

  const renderItem = useCallback(({ item }) => (
    <CategoryItem
      item={item}
      onQuantityChange={handleQuantityChange}
      cartItem={reduxItems[item.id]}
      // isAddLoading={isAddLoading}
    />
  ), [reduxItems, handleQuantityChange]);

  const FloatingCartButton = () => {
    const translateY = scrollY.interpolate({
      inputRange: [0, 50],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={[styles.floatingCartContainer,
      //  { transform: [{ translateY }] }
       ]}>
        <TouchableOpacity
          style={styles.floatingCartButton}
          onPress={() => navigation.navigate('CartScreen')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[appTheme.colors.primary, appTheme.colors.primary]}
            // style={styles.floatingCartGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.floatingCartGradient}>
              <View style={styles.cartContentContainer}>
                <Icon name="cart" size={24} color={appTheme.colors.white} />
                {cartItemsCount > 0 && (
                  <View style={styles.floatingCartBadge}>
                    <Text style={styles.floatingCartBadgeText}>{cartItemsCount}</Text>
                  </View>
                )}
              </View>
              {/* <View style={styles.cartTotalContainer}>
                <Text style={styles.cartTotalText}>
                  ₹{Object.values(reduxItems).reduce(
                    (sum, item) => sum + ((item.sellingPrice || item.price || 0) * (item.quantity || 0)),
                    0
                  ).toFixed(2)}
                </Text>
              </View> */}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={appTheme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={[appTheme.colors.primary, appTheme.colors.secondary]}
        style={[styles.header,{height:Platform.OS=="ios" ?"8%":"7%",}]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon2
            name="arrow-back"
            size={24}
            color={appTheme.colors.white}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName}</Text>
        <View style={{ width: 24 }} /> {/* Spacer for alignment */}
      </LinearGradient>

      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Icon 
            name="magnify" 
            size={20} 
            color={appTheme.colors.dark + '80'} 
            style={styles.searchIcon} 
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor={appTheme.colors.dark + '80'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Animated.FlatList
          ref={flatListRef}
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={item => item.refId}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          scrollEventThrottle={16}
          removeClippedSubviews={false}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="food-off" size={48} color={appTheme.colors.dark + '50'} />
              <Text style={styles.emptyText}>
                {isLoading ? 'Loading items...' : 'No items found'}
              </Text>
            </View>
          }
        />
      </View>

      <FloatingCartButton />
      <Toast message={toastMessage} visible={toastVisible} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appTheme.colors.pastelCream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appTheme.colors.pastelCream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    
    ...appTheme.shadows.medium,
    // height:Platform.OS="ios" && "15%"
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: appTheme.colors.white,
  },
  backButton: {
    padding: 4,
  },
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.pastelCream,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.colors.white,
    margin: 16,
    borderRadius: appTheme.borderRadius.md,
    paddingHorizontal: 16,
    ...appTheme.shadows.small,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    color: appTheme.colors.dark,
    fontSize: 16,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: appTheme.colors.dark + '80',
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: appTheme.colors.white,
    padding: 16,
    marginBottom: 12,
    borderRadius: appTheme.borderRadius.lg,
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
    fontWeight: 'bold',
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
  itemIngredients: {
    fontSize: 12,
    color: appTheme.colors.dark + '60',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  itemStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemAvailable: {
    fontSize: 14,
    color: appTheme.colors.dark + '80',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: appTheme.colors.primary,
  },
  lowStock: {
    marginTop: 4,
    fontSize: 12,
    color: appTheme.colors.accent,
    fontWeight: 'bold',
  },
  quantityControls: {
    alignItems: 'center',
  },
  addButton: {
    borderRadius: appTheme.borderRadius.md,
    overflow: 'hidden',
  },
  addButtonGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: appTheme.colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  quantityWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.colors.pastelGreen,
    borderRadius: appTheme.borderRadius.md,
    ...appTheme.shadows.small,
    // borderRadius:6
  },
  quantityButton: {
    backgroundColor: appTheme.colors.primary,
    // padding: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius:6
  },
  quantityButtonText: {
    color: appTheme.colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  quantityText: {
    marginHorizontal: 12,
    fontSize: 16,
    color: appTheme.colors.dark,
    fontWeight: '600',
  },
  floatingCartContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 999,
  },
  floatingCartButton: {
    borderRadius: appTheme.borderRadius.lg,
    overflow: 'hidden',
    ...appTheme.shadows.large,
  },
  floatingCartGradient: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cartContentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingVertical: 12,
    // paddingHorizontal: 20,
  },
  cartIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  floatingCartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: appTheme.colors.accent,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCartBadgeText: {
    color: appTheme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cartTotalContainer: {
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 1,
    borderLeftColor: appTheme.colors.white + '80',
  },
  cartTotalText: {
    color: appTheme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  ingredientsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingVertical: 4,
  },
  ingredientsTitle: {
    fontSize: 12,
    color: appTheme.colors.dark + '80',
    fontWeight: '500',
  },
  ingredientsList: {
    marginBottom: 8,
    paddingLeft: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  ingredientName: {
    fontSize: 12,
    color: appTheme.colors.dark + '60',
    flex: 1,
  },
  ingredientQuantity: {
    fontSize: 12,
    color: appTheme.colors.dark + '60',
    marginLeft: 8,
  },
});

export default CategoryItemsScreen;