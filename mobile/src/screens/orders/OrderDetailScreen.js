import { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { orderApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { Banner, Button, ErrorView, LoadingView, StatusBadge, styles } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { confirmAction } from '../../utils/confirm';
import { formatDate, formatPrice, shortId } from '../../utils/format';

// The next step an admin can move an order to (mirrors TRANSITIONS on the server)
const NEXT_STATUS = { Pending: 'Preparing', Preparing: 'Ready', Ready: 'Completed' };

export default function OrderDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user, isAdmin } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    try {
      setError('');
      setOrder(await orderApi.get(id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Runs an API action, shows a spinner on that button and any error in a banner
  const run = async (key, fn, after) => {
    setBusy(key);
    setActionError('');
    try {
      const result = await fn();
      if (after) after(result);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy('');
    }
  };

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={load} />;

  const isOwner = order.user?._id === user._id;
  const pending = order.status === 'Pending';
  const next = NEXT_STATUS[order.status];
  const canAdminCancel = isAdmin && ['Pending', 'Preparing'].includes(order.status);
  const canDelete = ['Pending', 'Cancelled', 'Completed'].includes(order.status);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.row}>
        <Text style={styles.title}>Order #{shortId(order._id)}</Text>
        <StatusBadge status={order.status} />
      </View>
      <Text style={styles.muted}>Placed {formatDate(order.createdAt)}</Text>
      {isAdmin && order.user ? (
        <Text style={styles.muted}>
          Customer: {order.user.name} ({order.user.email}{order.user.phone ? `, ${order.user.phone}` : ''})
        </Text>
      ) : null}

      <View style={[styles.card, { marginTop: spacing.lg }]}>
        {order.items.map((i) => (
          <View key={String(i.menuItem)} style={[styles.row, { paddingVertical: spacing.xs }]}>
            <Text style={{ flex: 1 }}>{i.quantity} × {i.name}</Text>
            <Text>{formatPrice(i.subtotal)}</Text>
          </View>
        ))}
        <View style={[styles.row, { borderTopWidth: 1, borderColor: colors.border, marginTop: spacing.sm, paddingTop: spacing.sm }]}>
          <Text style={styles.subtitle}>Total</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>{formatPrice(order.totalAmount)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Delivery address</Text>
        <Text>{order.deliveryAddress}</Text>
        {order.notes ? (
          <>
            <Text style={[styles.label, { marginTop: spacing.md }]}>Notes</Text>
            <Text>{order.notes}</Text>
          </>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Status history</Text>
        {order.statusHistory.map((h, idx) => (
          <Text key={idx} style={styles.muted}>
            {h.status} — {formatDate(h.changedAt)}
          </Text>
        ))}
      </View>

      <Banner message={actionError} />

      {/* Customer actions: only while the kitchen has not started */}
      {isOwner && pending ? (
        <>
          <Button title="Edit order" onPress={() => navigation.navigate('EditOrder', { id: order._id })} />
          <Button
            title="Cancel order"
            variant="outline"
            style={{ marginTop: spacing.md }}
            loading={busy === 'cancel'}
            onPress={() =>
              confirmAction('Cancel order', 'Cancel this order? The items go back on the menu.', () =>
                run('cancel', () => orderApi.cancel(order._id), setOrder)
              )
            }
          />
        </>
      ) : null}

      {/* Admin actions: move the order through the kitchen workflow */}
      {isAdmin && next ? (
        <Button
          title={`Mark as ${next}`}
          style={{ marginTop: spacing.md }}
          loading={busy === 'status'}
          onPress={() => run('status', () => orderApi.setStatus(order._id, next), setOrder)}
        />
      ) : null}
      {canAdminCancel && !isOwner ? (
        <Button
          title="Cancel order"
          variant="outline"
          style={{ marginTop: spacing.md }}
          loading={busy === 'adminCancel'}
          onPress={() =>
            confirmAction('Cancel order', 'Cancel this order and return the items to stock?', () =>
              run('adminCancel', () => orderApi.setStatus(order._id, 'Cancelled'), setOrder)
            )
          }
        />
      ) : null}

      {canDelete ? (
        <Button
          title="Delete order"
          variant="danger"
          style={{ marginTop: spacing.md }}
          loading={busy === 'delete'}
          onPress={() =>
            confirmAction('Delete order', 'Permanently delete this order from the history?', () =>
              run('delete', () => orderApi.remove(order._id), () => navigation.goBack())
            )
          }
        />
      ) : null}
    </ScrollView>
  );
}
