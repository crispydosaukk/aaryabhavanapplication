// firebase-config.js
import { initializeApp } from '@react-native-firebase/app';
import { getFirestore } from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyD-2mlJKJNVLy-9t6B8Y1zCaVlquO7lZEo',
  authDomain: 'abkitchen-bbb9c.firebaseapp.com',
  projectId: 'abkitchen-bbb9c',
  storageBucket: 'abkitchen-bbb9c.firebasestorage.app',
  messagingSenderId: '512812298134',
  appId: '1:512812298134:web:8134f315c90a041272b7b7',
  measurementId: 'G-462PXF61EG'
};

// Initialize Firebase
let app;
let db;
let storage;

try {
  if (!initializeApp.length) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    storage = getStorage(app);
  } else {
    app = initializeApp();
    db = getFirestore();
    storage = getStorage();
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { db, storage };