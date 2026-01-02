import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '128484716788-ugjfujok3466j3a8s8m82mm49gqjnoc1.apps.googleusercontent.com', // Your Web Client ID
  offlineAccess: true,
  forceCodeForRefreshToken: true,
});

export default GoogleSignin;