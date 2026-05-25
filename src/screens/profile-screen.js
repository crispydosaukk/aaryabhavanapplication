import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Animated,
  Platform,
  SafeAreaView,
  StatusBar,
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
  
  // Animation values
  const scaleValue = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleLogout = async () => {
    Animated.sequence([
      Animated.timing(scaleValue, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleValue, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
            dispatch({ type: 'CLEAR_USER' });
            dispatch(setCartData({}));
            await AsyncStorage.removeItem('user');
            navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
          } catch (error) {
            console.error('Error during logout:', error);
            Alert.alert('Error', 'Failed to log out.');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrapper}>
        <Icon name={icon} size={20} color={appTheme.colors.primary} />
      </View>
      <View style={styles.infoTextWrapper}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>{value || 'Not provided'}</Text>
      </View>
    </View>
  );

  const ActionRow = ({ icon, title, subtitle, onPress, gradientColors, isLast }) => (
    <TouchableOpacity style={[styles.actionCard, isLast && { borderBottomWidth: 0 }]} onPress={onPress} activeOpacity={0.7}>
      <LinearGradient colors={gradientColors} style={styles.actionIconWrapper} start={{x:0, y:0}} end={{x:1, y:1}}>
        <MaterialIcons name={icon} size={24} color="white" />
      </LinearGradient>
      <View style={styles.actionTextWrapper}>
        <Text style={styles.actionTitle}>{title}</Text>
        {subtitle && <Text style={styles.actionSubtitle}>{subtitle}</Text>}
      </View>
      <MaterialIcons name="chevron-right" size={24} color={appTheme.colors.dark + '40'} />
    </TouchableOpacity>
  );

  const HeaderSection = () => (
    <LinearGradient
      colors={[appTheme.colors.primary, appTheme.colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.headerGradient}
    >
      <SafeAreaView>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <View style={styles.headerProfile}>
          <View style={styles.avatarWrapper}>
            <Text style={styles.avatarText}>
              {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.nameText}>{user?.name || 'User'}</Text>
          <Text style={styles.roleText}>{user?.restaurantName || 'Restaurant User'}</Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} bounces={false}>
        <HeaderSection />

        <View style={styles.mainContent}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoContainer}>
            <InfoRow icon="email" label="Email Address" value={user?.email} />
            <View style={styles.divider} />
            <InfoRow icon="phone" label="Phone Number" value={user?.phone} />
            <View style={styles.divider} />
            <InfoRow icon="map-marker" label="Location" value={user?.address} />
          </View>

          <Text style={styles.sectionTitle}>Operations</Text>
          <View style={styles.actionsContainer}>
            <ActionRow 
              icon="restaurant" 
              title="Kitchen Checklists" 
              subtitle="Daily kitchen workflows"
              gradientColors={['#FF9A9E', '#FECFEF']}
              onPress={() => navigation.navigate('ChecklistSelectionScreen', { type: 'kitchen' })} 
            />
            <ActionRow 
              icon="storefront" 
              title="Restaurant Checklists" 
              subtitle="Front-of-house operations"
              gradientColors={['#a18cd1', '#fbc2eb']}
              onPress={() => navigation.navigate('ChecklistSelectionScreen', { type: 'restaurant' })} 
            />
            <ActionRow 
              icon="history" 
              title="Checklist History" 
              subtitle="View and edit past reports"
              gradientColors={['#84fab0', '#8fd3f4']}
              onPress={() => navigation.navigate('ChecklistHistoryScreen')} 
              isLast
            />
          </View>

          <Animated.View style={{ transform: [{ scale: scaleValue }], marginTop: 24, marginBottom: 20 }}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
              <Icon name="logout" size={22} color={appTheme.colors.primary} />
              <Text style={styles.logoutButtonText}>Log Out</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerGradient: {
    paddingBottom: 32,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    ...appTheme.shadows.medium,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.5,
  },
  headerProfile: {
    alignItems: 'center',
    marginTop: 20,
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'white',
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
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  mainContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: appTheme.colors.dark + '80',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
    marginLeft: 8,
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 16,
    marginBottom: 32,
    ...appTheme.shadows.small,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  infoIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: appTheme.colors.pastelCream,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: appTheme.colors.dark + '60',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 15,
    color: appTheme.colors.dark,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 4,
    marginLeft: 60,
  },
  actionsContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 16,
    ...appTheme.shadows.small,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F4F4',
  },
  actionIconWrapper: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextWrapper: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: appTheme.colors.dark,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 13,
    color: appTheme.colors.dark + '70',
    fontWeight: '400',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: appTheme.colors.primary + '20',
    ...appTheme.shadows.small,
  },
  logoutButtonText: {
    color: appTheme.colors.primary,
    fontWeight: '700',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default ProfileScreen;