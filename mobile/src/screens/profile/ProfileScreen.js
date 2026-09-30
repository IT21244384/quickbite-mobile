import { Text, View } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Button, styles } from '../../components/ui';
import { API_URL } from '../../api/client';
import { colors, spacing } from '../../theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { clear } = useCart();

  const onLogout = async () => {
    clear();
    await logout();
  };

  return (
    <View style={[styles.screen, styles.content]}>
      <View style={styles.card}>
        <Text style={styles.title}>{user.name}</Text>
        <Text style={styles.muted}>{user.email}</Text>
        {user.phone ? <Text style={styles.muted}>{user.phone}</Text> : null}
        <Text style={{ marginTop: spacing.md, fontWeight: '600', color: user.isAdmin ? colors.primary : colors.text }}>
          {user.isAdmin ? 'Administrator' : 'Customer'}
        </Text>
      </View>

      <Button title="Log out" variant="secondary" onPress={onLogout} />

      <Text style={[styles.muted, { marginTop: spacing.xl, fontSize: 12, textAlign: 'center' }]}>Connected to {API_URL}</Text>
    </View>
  );
}
