import React from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';

const Toast = ({message, visible}) => {
  const [fadeAnim] = React.useState(new Animated.Value(0)); // Fade animation state

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 3000); // Toast will be visible for 3 seconds
    }
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View style={[styles.toast, {opacity: fadeAnim}]}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    backgroundColor: 'green', // Green background
    paddingVertical: 15, // Increased height
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  toastText: {
    color: 'white', // White text
    fontSize: 18, // Increased font size
    fontWeight: 'bold',
  },
});

export default Toast;
