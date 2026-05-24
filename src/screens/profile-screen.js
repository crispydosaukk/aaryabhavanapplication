import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Animated,
  Image,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setCartData } from '../features/cart-slice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

import LinearGradient from 'react-native-linear-gradient';
import appTheme from '../abTheme';

const ProfileScreen = () => {
  const { user } = useSelector(state => state.user);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Animation values
  const scaleValue = new Animated.Value(1);
  const fadeAnim = new Animated.Value(1);

  const handleLogout = async () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }).start();

              dispatch({ type: 'CLEAR_USER' });
              dispatch(setCartData({}));
              await AsyncStorage.removeItem('user');

              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const ProfileCard = ({ icon, label, value }) => (
    <View style={styles.profileCard}>
      <View style={styles.cardIconContainer}>
        <Icon 
          name={icon} 
          size={20} 
          color={appTheme.colors.primary} 
        />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardValue} numberOfLines={2}>{value || 'Not provided'}</Text>
      </View>
    </View>
  );

  const HeaderSection = () => (
    <LinearGradient
      colors={[appTheme.colors.primary, appTheme.colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      
    >
      <View style={styles.headerGradient}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={{paddingLeft:10}}>
        {/* <Text style={{fontSize:20,paddingLeft:10}}>back</Text> */}
        <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
        <View style={styles.avatarWrapper}>
          <Text style={styles.avatarText}>
            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
          </Text>
        </View>
        {/* <Text style={styles.welcomeText}>Welcome back</Text> */}
        <Text style={styles.nameText}>{user?.name || 'User'}</Text>
      </View>
      </View>
    </LinearGradient>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <SafeAreaView>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <HeaderSection />

        <View style={styles.cardContainer}>
          <ProfileCard
            icon="store"
            label="Restaurant"
            value={user?.restaurantName}
          />
          <ProfileCard
            icon="email"
            label="Email"
            value={user?.email}
          />
          <ProfileCard
            icon="phone"
            label="Phone"
            value={user?.phone}
          />
          <ProfileCard
            icon="map-marker"
            label="Address"
            value={user?.address}
          />
        </View>

        <View style={[styles.actionsContainer, { marginTop: -10 }]}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('ChecklistSelectionScreen', { type: 'kitchen' })}
          >
            <LinearGradient
              colors={['#e0f7fa', '#b2ebf2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.actionButtonGradient}>
              <MaterialIcons name="restaurant" size={24} color={appTheme.colors.dark} />
              <Text style={[styles.actionButtonText, { fontSize: 14 }]}>Kitchen Checklists</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('ChecklistSelectionScreen', { type: 'restaurant' })}
          >
            <LinearGradient
              colors={['#fff9c4', '#fff59d']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.actionButtonGradient}>
              <MaterialIcons name="storefront" size={24} color={appTheme.colors.dark} />
              <Text style={[styles.actionButtonText, { fontSize: 14 }]}>Restaurant Checklists</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[appTheme.colors.accent, appTheme.colors.secondary]}
              
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.logoutButtonGradient}>
              <Icon name="logout" size={24} color={appTheme.colors.white} />
              <Text style={styles.logoutButtonText}>Logout</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.pastelCream,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? 10 : 20,
    paddingBottom: 20,
    marginBottom: 20,
    ...appTheme.shadows.medium,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: appTheme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    ...appTheme.shadows.large,
  },
  avatarText: {
    color: appTheme.colors.primary,
    fontSize: 36,
    fontWeight: 'bold',
  },
  welcomeText: {
    fontSize: 16,
    color: appTheme.colors.white,
    marginBottom: 4,
    opacity: 0.9,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: appTheme.colors.white,
  },
  cardContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appTheme.colors.white,
    padding: 16,
    borderRadius: appTheme.borderRadius.lg,
    marginBottom: 12,
    ...appTheme.shadows.small,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: appTheme.colors.pastelGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 14,
    color: appTheme.colors.dark + '80',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    color: appTheme.colors.dark,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
    borderRadius: appTheme.borderRadius.md,
    overflow: 'hidden',
    ...appTheme.shadows.small,
  },
  actionButtonGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: appTheme.colors.dark,
    fontWeight: '500',
  },
  logoutButton: {
    marginHorizontal: 20,
    borderRadius: appTheme.borderRadius.lg,
    overflow: 'hidden',
    ...appTheme.shadows.medium,
  },
  logoutButtonGradient: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: appTheme.colors.white,
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 8,
  },
});

export default ProfileScreen;