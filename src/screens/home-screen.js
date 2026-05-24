import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  SafeAreaView,
  Animated,
  TextInput,
  Platform,
} from 'react-native';
import { db } from '../firebase-config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs 
} from '@react-native-firebase/firestore';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {setCartData} from '../features/cart-slice';
import LinearGradient from 'react-native-linear-gradient';
import CartIcon from '../components/cart-icon';
import ProfileIcon from '../components/profile-icon';
import appTheme from '../abTheme';
import logo from '../assets/abLogoIcon.png'; // Update with your new logo

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const {width, height} = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1;
const HEADER_HEIGHT = height * 0.22;

const HomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [categories, setCategories] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const {user} = useSelector(state => state.user);
  const scrollY = new Animated.Value(0);

  const loadCartData = async () => {
    try {
      const userCartRef = doc(db, 'userCart', user.id);
      const cartDoc = await getDoc(userCartRef);
      if (cartDoc.exists) {
        dispatch(setCartData(cartDoc.data()));
      }
    } catch (error) {
      console.error('Failed to load cart data:', error);
    }
  };
  
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const catRef = collection(db, 'inventoryCategory');
      const querySnapshot = await getDocs(catRef);
      if (!querySnapshot.empty) {
        const categoriesArray = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCategories(categoriesArray);
        setFilteredCategories(categoriesArray);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadCartData(), fetchCategories()]);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadCartData();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.category.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredCategories(filtered);
    }
  }, [searchQuery, categories]);

  const renderHeader = () => {
    const headerTranslateY = scrollY.interpolate({
      inputRange: [0, HEADER_HEIGHT],
      outputRange: [0, -HEADER_HEIGHT * 0.6],
      extrapolate: 'clamp',
    });

    const headerScale = scrollY.interpolate({
      inputRange: [-100, 0],
      outputRange: [1.2, 1],
      extrapolate: 'clamp',
    });

    const nameTranslateY = scrollY.interpolate({
      inputRange: [0, 60],
      outputRange: [0, 60], // Move the name down slightly
      extrapolate: 'clamp',
    });

    const nameOpacity = scrollY.interpolate({
      inputRange: [0, 30],
      outputRange: [1, 1], // Optional: fade the name slightly on scroll
      extrapolate: 'clamp',
    });

    // const searchTranslateY = scrollY.interpolate({
    //   inputRange: [0, 80],
    //   outputRange: [40, 0], // Search bar comes into view from below
    //   extrapolate: 'clamp',
    // });

    // const searchOpacity = scrollY.interpolate({
    //   inputRange: [20, 80],
    //   outputRange: [0, 1], // Fade in search
    //   extrapolate: 'clamp',
    // });

    const searchTranslateY = scrollY.interpolate({
      inputRange: [0, 80],
      outputRange: [0, -80],
      extrapolate: 'clamp',
    });

    const searchOpacity = scrollY.interpolate({
      inputRange: [0, 60],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.header,
          {
            transform: [{translateY: headerTranslateY}, {scale: headerScale}],
          },
        ]}>
        <AnimatedLinearGradient
          colors={[appTheme.colors.primary, appTheme.colors.secondary]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.headerGradient}>
          <View style={styles.headerTop}>
            <ProfileIcon />
            <View style={styles.logoContainer}>
              {/* Replace with your actual logo */}
              <Image source={logo} style={styles.logo} resizeMode="contain" />
            </View>
            <View style={styles.headerIcons}>
              <CartIcon />
            </View>
          </View>

          <Animated.View
            style={[
              styles.searchContainer,
              
              {
                transform: [{translateY: nameTranslateY}],
                opacity: nameOpacity,
              },
            ]}>
            <MaterialIcons
              name="search"
              size={24}
              color={appTheme.colors.white}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search categories..."
              placeholderTextColor={appTheme.colors.white + 'aa'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </Animated.View>

          <View style={styles.headerContent}>
            {/* <Text style={styles.greeting}>Welcome back,</Text> */}
            <Animated.Text
              style={[
                styles.userName,
                {
                  transform: [{translateY: searchTranslateY}],
                  opacity: searchOpacity,
                },
              ]}>
              {user.name}
            </Animated.Text>
            {/* <Text style={styles.welcomeText}>Discover delicious recipes</Text> */}
          </View>
        </AnimatedLinearGradient>
      </Animated.View>
    );
  };

  const renderCategory = ({item, index}) => {
    console.log(item.image,"img")
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          {
            marginLeft:
              index % 2 === 0 ? appTheme.spacing.md : appTheme.spacing.sm,
            marginRight:
              index % 2 === 0 ? appTheme.spacing.sm : appTheme.spacing.md,
          },
        ]}
        onPress={() =>
          navigation.navigate('CategoryItemsScreen', {
            categoryId: item.id,
            categoryName: item.category,
          })
        }
        activeOpacity={0.9}>
        <View style={styles.imageContainer}>
          <Image
            source={{uri: item.image}}
            style={styles.categoryImage}
            resizeMode="cover"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />
          <View style={styles.categoryContent}>
            <Text style={styles.categoryText}>{item.category}</Text>
            <View style={styles.arrowContainer}>
              <MaterialIcons
                name="arrow-forward"
                size={20}
                color={appTheme.colors.white}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      <AnimatedFlatList
        data={
          filteredCategories
        }
        renderItem={renderCategory}
        keyExtractor={item => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {useNativeDriver: true},
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[appTheme.colors.primary]}
            tintColor={appTheme.colors.primary}
            progressViewOffset={HEADER_HEIGHT}
          />
        }
        ListHeaderComponent={<View style={{height: HEADER_HEIGHT - 40}} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="search-off"
              size={48}
              color={appTheme.colors.dark + '50'}
            />
            <Text style={styles.emptyText}>
              {loading ? 'Loading categories...' : 'No categories found'}
            </Text>
            {!loading && (
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={onRefresh}>
                <Text style={styles.refreshText}>Refresh</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.white,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    zIndex: 100,
    overflow: 'hidden',
  },
  headerGradient: {
    flex: 1,
    paddingHorizontal: Platform.OS === 'android' && appTheme.spacing.lg,
    paddingTop:
      Platform.OS === 'android' && appTheme.spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Platform.OS === 'ios' && appTheme.spacing.lg,
    paddingTop:
      Platform.OS === 'ios' && appTheme.spacing.sm,
    // alignItems: 'center',
    // marginBottom: appTheme.spacing.sm,
    // backgroundColor:"red"
  },
  logoContainer: {
    // flex: 1,
    marginRight: 5,
  },
  logo: {
    width: 50,
    height: 50,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContent: {
    marginTop: appTheme.spacing.sm,
    flexDirection: 'row',
    alignContent: 'center',
    marginHorizontal: Platform.OS === 'ios' && appTheme.spacing.lg,
    // paddingBottom:10
  },
  greeting: {
    fontSize: 18,
    color: appTheme.colors.white,
    opacity: 0.9,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: appTheme.colors.white,
    marginBottom: appTheme.spacing.sm,
    textAlignVertical: 'bottom',
  },
  welcomeText: {
    fontSize: 16,
    color: appTheme.colors.white + 'cc',
    marginBottom: appTheme.spacing.xl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.colors.primary + 'aa',
    borderRadius: appTheme.borderRadius.lg,
    paddingHorizontal: appTheme.spacing.md,
    height: 50,
    marginTop: 10,
    borderWidth: 1,
    borderColor: appTheme.colors.white + '33',
    ...appTheme.shadows.large,
    marginHorizontal: Platform.OS === 'ios' && appTheme.spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: appTheme.spacing.sm,
    fontSize: 16,
    color: appTheme.colors.white,
    height: '100%',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'Roboto',
  },
  listContainer: {
    paddingTop: appTheme.spacing.xl,
    paddingBottom: appTheme.spacing.xl * 2,
  },
  categoryItem: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: appTheme.borderRadius.lg,
    marginBottom: appTheme.spacing.lg,
    overflow: 'hidden',
    ...appTheme.shadows.medium,
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  categoryContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: appTheme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  categoryText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: appTheme.colors.white,
    marginRight: appTheme.spacing.sm,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  arrowContainer: {
    backgroundColor: appTheme.colors.secondary,
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: appTheme.spacing.lg,
  },
  emptyText: {
    marginTop: appTheme.spacing.md,
    fontSize: 16,
    color: appTheme.colors.dark + '80',
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: appTheme.spacing.md,
    paddingVertical: appTheme.spacing.sm,
    paddingHorizontal: appTheme.spacing.lg,
    backgroundColor: appTheme.colors.primary,
    borderRadius: appTheme.borderRadius.lg,
  },
  refreshText: {
    color: appTheme.colors.white,
    fontWeight: '600',
  },
});

export default HomeScreen;
