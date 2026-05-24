import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // or get user data from wherever you're storing it

const ProfileIcon = () => {
  const navigation = useNavigation();
  const [userInitials, setUserInitials] = useState('');

  // Simulate getting user data from AsyncStorage or a backend
  const loadUserData = async () => {
    try {
      // For demo, let's assume we have stored the user name in AsyncStorage
      const userData = await AsyncStorage.getItem('user'); // or replace this with actual user data fetching logic
      const user = JSON.parse(userData); // Parse the user data if stored in JSON format

      if (user && user.name) {
        const initials = user.name.split(' ').map(part => part[0]).join('').substring(0, 2);
        setUserInitials(initials.toUpperCase());
      } else {
        setUserInitials('UN'); // Fallback initials for 'Unknown User'
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  return (
    <TouchableOpacity onPress={() => navigation.navigate('ProfileScreen')} style={styles.profileContainer}>
      <View style={styles.profileCircle}>
        <Text style={styles.profileText}>{userInitials}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  profileContainer: {
    marginRight: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCircle: {
    width: 45, // Adjust size as necessary
    height: 45,
    borderRadius: 25, // Makes the view circular
    backgroundColor: '#FFF8E1', // Mustard yellow background (theme color)
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3, // Slight shadow
  },
  profileText: {
    color: 'red', // White text color
    fontSize: 22, // Adjust font size
    fontWeight: 'bold', // Bold text
  },
});

export default ProfileIcon;
