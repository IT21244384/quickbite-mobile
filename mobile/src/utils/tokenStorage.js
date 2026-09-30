import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// The JWT is kept in the phone's encrypted keystore (SecureStore).
// SecureStore does not exist in a web browser, so web falls back to localStorage.
const KEY = 'quickbite_token';

export async function saveToken(token) {
  if (Platform.OS === 'web') return localStorage.setItem(KEY, token);
  return SecureStore.setItemAsync(KEY, token);
}

export async function getToken() {
  if (Platform.OS === 'web') return localStorage.getItem(KEY);
  return SecureStore.getItemAsync(KEY);
}

export async function removeToken() {
  if (Platform.OS === 'web') return localStorage.removeItem(KEY);
  return SecureStore.deleteItemAsync(KEY);
}
