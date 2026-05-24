import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  Image,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView
} from 'react-native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, getDocs } from '@react-native-firebase/firestore';
import { login } from '../features/user-slice';
import { db } from '../firebase-config';
import logo from '../assets/abLogo.png'; // Update with your new logo
// import appTheme from '../theme';
import LinearGradient from 'react-native-linear-gradient'; 
import appTheme from '../abTheme';

const { width, height } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const dispatch = useDispatch();

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          dispatch(login(JSON.parse(userData)));
          navigation.navigate('MainTabNavigator');
        }
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setLoading(false);
      }
    };
    checkLoginStatus();
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleLogin = async () => {
    if (!validateEmail(email) || !password) {
      if (!password) alert('Password is required');
      return;
    }
  
    setLoginLoading(true);
    try {
      // Create a query against the 'users' collection
      console.log(db,"ITS DDBBB")
      const q = query(
        collection(db, 'users'),
        where('email', '==', email.toLowerCase().trim()),
        where('password', '==', password)
      );
  
      // Execute the query
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        // Get the first document (assuming emails are unique)
        const userDoc = querySnapshot.docs[0];
        const userData = {
          id: userDoc.id, // Include document ID
          ...userDoc.data() // Spread all document data
        };
        
        // Dispatch to Redux and store in AsyncStorage
        dispatch(login(userData));
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        
        // Navigate to main app screen
        navigation.navigate('MainTabNavigator');
      } else {
        alert('Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  const renderLoginForm = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentContainer}>
          <Image source={logo} style={styles.logo} />

          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.subText}>Please login to continue</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <TextInput
                placeholder="Enter your email"
                placeholderTextColor={appTheme.colors.dark + '80'}
                style={styles.input}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  validateEmail(text);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Enter your password"
                  placeholderTextColor={appTheme.colors.dark + '80'}
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!passwordVisible}
                />
                <TouchableOpacity 
                  onPress={() => setPasswordVisible(!passwordVisible)}
                  style={styles.showHideButton}
                >
                  <Text style={styles.showHideText}>
                    {passwordVisible ? 'HIDE' : 'SHOW'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loginLoading}
              style={styles.loginButton}
            >
              <LinearGradient
                colors={[appTheme.colors.primary, appTheme.colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                {loginLoading ? (
                  <ActivityIndicator size="small" color={appTheme.colors.white} />
                ) : (
                  <Text style={styles.loginButtonText}>LOGIN</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  return loading ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={appTheme.colors.primary} />
    </View>
  ) : (
    renderLoginForm()
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: appTheme.colors.pastelCream,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: appTheme.spacing.md,
    paddingBottom: appTheme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: appTheme.colors.pastelCream,
  },
  logo: {
    width: width * 0.7,
    height: width * 0.3,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: appTheme.spacing.xl,
  },
  formContainer: {
    width: '100%',
    padding: appTheme.spacing.md,
    backgroundColor: appTheme.colors.white,
    borderRadius: appTheme.borderRadius.lg,
    ...appTheme.shadows.medium,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: appTheme.colors.primary,
    marginBottom: appTheme.spacing.sm,
    textAlign: 'center',
  },
  subText: {
    fontSize: 16,
    color: appTheme.colors.dark + 'CC',
    marginBottom: appTheme.spacing.xl,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: appTheme.spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: appTheme.colors.dark,
    marginBottom: appTheme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: appTheme.colors.pastelGreen,
    padding: appTheme.spacing.md,
    borderRadius: appTheme.borderRadius.md,
    color: appTheme.colors.dark,
    backgroundColor: appTheme.colors.white,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: appTheme.colors.pastelGreen,
    borderRadius: appTheme.borderRadius.md,
    backgroundColor: appTheme.colors.white,
    overflow: 'hidden',
  },
  passwordInput: {
    flex: 1,
    padding: appTheme.spacing.md,
    color: appTheme.colors.dark,
    fontSize: 16,
    height: 50,
  },
  showHideButton: {
    paddingHorizontal: appTheme.spacing.md,
    height: 50,
    justifyContent: 'center',
    backgroundColor: appTheme.colors.pastelPeach,
  },
  showHideText: {
    color: appTheme.colors.secondary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  loginButton: {
    marginTop: appTheme.spacing.lg,
    borderRadius: appTheme.borderRadius.md,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: appTheme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius:8
  },
  loginButtonText: {
    color: appTheme.colors.white,
    // color:"black",
    fontSize: 16,
    fontWeight: 'bold',
    // padding:Platform.OS =="ios" ? 18:0,
    paddingBottom:Platform.OS =="ios" ? 35:0
    // alignSelf:'center'
    // verticalAlign:'middle'
  },
  errorText: {
    color: appTheme.colors.accent,
    fontSize: 12,
    marginTop: appTheme.spacing.xs,
  },
});

export default LoginScreen;