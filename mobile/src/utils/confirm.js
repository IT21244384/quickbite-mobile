import { Alert, Platform } from 'react-native';

// Asks "are you sure?" before a destructive action.
// Alert.alert with buttons does not work on web, so web uses window.confirm.
export function confirmAction(title, message, onConfirm) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'No', style: 'cancel' },
    { text: 'Yes', style: 'destructive', onPress: onConfirm },
  ]);
}
