import React, { useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { 
  View, 
  StyleSheet, 
  Platform, 
  SafeAreaView, 
  Image, 
  Dimensions,
  TouchableOpacity,
  Animated
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import HomeScreen from './home-screen';
import OrderHistoryScreen from './order-history-screen';
import ProfileIcon from '../components/profile-icon';
import CartIcon from '../components/cart-icon';
import appTheme from '../abTheme';
import logo from '../assets/abLogo.png';
import WasteManagementScreen from './wasteManagementScreen';

const Tab = createBottomTabNavigator();
const { width } = Dimensions.get('window');

// Custom animated tab button using React Native's Animated API
const TabButton = ({ accessibilityState, children, onPress, iconName }) => {
  const selected = accessibilityState.selected;
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0.7)).current;
  
  useEffect(() => {
    // Run animations when selected state changes
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: selected ? 1.2 : 1,
        friction: 8,
        tension: 50,
        useNativeDriver: true
      }),
      Animated.spring(translateYAnim, {
        toValue: selected ? -15 : 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: selected ? 1 : 0.7,
        duration: 200,
        useNativeDriver: true
      })
    ]).start();
  }, [selected, scaleAnim, translateYAnim, opacityAnim]);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tabButton}
      activeOpacity={0.7}
    >
      <Animated.View 
        style={[
          styles.tabButtonContainer, 
          {
            transform: [
              { translateY: translateYAnim },
            ]
          }
        ]}
      >
        {selected && (
          <LinearGradient
            colors={[appTheme.colors.primary, appTheme.colors.secondary]}
            style={styles.selectedBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        )}
        <Animated.View 
          style={[
            styles.iconContainer, 
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim
            }
          ]}
        >
          <Icon 
            name={iconName}
            size={28}
            style={styles.tabIcon}
            color={selected ? appTheme.colors.white : appTheme.colors.dark + '80'}
          />
        </Animated.View>
        {selected && (
          <Animated.Text style={styles.tabLabel}>
            {children}
          </Animated.Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Custom header component
const CustomHeader = () => (
  <LinearGradient
    colors={[appTheme.colors.primary, appTheme.colors.secondary]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={styles.headerGradient}
  >
    <SafeAreaView style={styles.headerContainer}>
      <ProfileIcon />
      <Image
        source={logo}
        style={styles.logoImage}
        resizeMode="contain"
      />
      <CartIcon notificationCount={5} />
    </SafeAreaView>
  </LinearGradient>
);

const MainTabNavigator = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: styles.tabBar,
          headerShown: false,
          tabBarShowLabel: false,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            header: () => <CustomHeader />,
            tabBarButton: (props) => (
              <TabButton {...props} iconName="home">Home</TabButton>
            ),
          }}
        />
        <Tab.Screen
          name="History"
          component={OrderHistoryScreen}
          options={{
            header: () => <CustomHeader />,
            tabBarButton: (props) => (
              <TabButton {...props} iconName="history">History</TabButton>
            ),
          }}
        />
        <Tab.Screen
          name="WasteManagement"
          component={WasteManagementScreen}
          options={{
            header: () => <CustomHeader />,
            tabBarButton: (props) => (
              <TabButton {...props} iconName="restore-from-trash">Waste</TabButton>
            ),
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.pastelCream,
    marginBottom: Platform.OS == 'ios' ? -68 : -18
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? 30 : 0,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    zIndex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: appTheme.spacing.lg,
    height: 90,
  },
  logoImage: {
    width: width * 0.4,
    height: 60,
  },
  tabBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 25 : 15,
    left: appTheme.spacing.lg,
    right: appTheme.spacing.lg,
    height: 70,
    borderRadius: appTheme.borderRadius.lg,
    backgroundColor: appTheme.colors.white,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: appTheme.colors.pastelGreen,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  tabButtonContainer: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: appTheme.borderRadius.lg,
    position: 'relative',
  },
  selectedBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: appTheme.borderRadius.lg,
  },
  iconContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIcon: {
    width: '100%',
    height: '100%',
    marginBottom: 10
  },
  tabLabel: {
    position: 'absolute',
    bottom: 5,
    fontSize: 10,
    fontWeight: 'bold',
    color: appTheme.colors.white,
    textAlign: 'center',
  },
});

export default MainTabNavigator;