/**
 * Firebase Configuration
 * Phone Authentication enabled for OTP verification
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyCejlj4B3tBo5UMbpKwSSblspRqkvFrX7I",
  authDomain: "agrimater-rfs1e1.firebaseapp.com",
  projectId: "agrimater-rfs1e1",
  storageBucket: "agrimater-rfs1e1.firebasestorage.app",
  messagingSenderId: "701414149207",
  appId: "1:701414149207:web:496dfe2d4cfa61f190e712"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;
