import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { orderApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { EmptyState, ErrorView, LoadingView, StatusBadge, styles } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { formatDate, formatPrice, shortId } from '../../utils/format';

const FILTERS = ['', 'Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

// Customers see their own order history; admins see every order
export default function OrdersScreen({ navigation }) {
  const { isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setOrders(await orderApi.list(status));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) return <LoadingView message="Loading orders..." />;

  return (
    <View style={styles.screen}>
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: spacing.md }}>
          {FILTERS.map((s) => {
            const active = s === status;
            return (
              <Pressable
                key={s || 'all'}
                onPress={() => setStatus(s)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 16,
                  marginRight: spacing.sm,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primary : '#fff',
                }}
              >
                <Text style={{ color: active ? '#fff' : colors.text }}>{s || 'All'}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {error ? (
        <ErrorView message={error} onRetry={load} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(o) => o._id}
          contentContainerStyle={[{ paddingHorizontal: spacing.lg }, orders.length === 0 && { flexGrow: 1 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={
            <EmptyState
              title="No orders yet"
              message={isAdmin ? 'Orders placed by customers will appear here.' : 'Your placed orders will appear here.'}
            />
          }
          renderItem={({ item: order }) => (
            <Pressable style={styles.card} onPress={() => navigation.navigate('OrderDetail', { id: order._id })}>
              <View style={styles.row}>
                <Text style={styles.subtitle}>Order #{shortId(order._id)}</Text>
                <StatusBadge status={order.status} />
              </View>
              {isAdmin && order.user ? <Text style={styles.muted}>{order.user.name} · {order.user.email}</Text> : null}
              <Text style={styles.muted} numberOfLines={1}>
                {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
              </Text>
              <View style={[styles.row, { marginTop: spacing.sm }]}>
                <Text style={styles.muted}>{formatDate(order.createdAt)}</Text>
                <Text style={{ fontWeight: '700', color: colors.primary }}>{formatPrice(order.totalAmount)}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
