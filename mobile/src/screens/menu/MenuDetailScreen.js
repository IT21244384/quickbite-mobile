import { useCallback, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { menuApi } from '../../api';
import { imageUri } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Banner, Button, ErrorView, LoadingView, QuantityStepper, styles } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { confirmAction } from '../../utils/confirm';
import { formatPrice } from '../../utils/format';

export default function MenuDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { isAdmin } = useAuth();
  const { addItem } = useCart();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      setItem(await menuApi.get(id));
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

  const onAdd = () => {
    addItem(item, quantity);
    setMessage(`${quantity} × ${item.name} added to your cart`);
    setQuantity(1);
  };

  const onDelete = () =>
    confirmAction('Delete item', `Delete "${item.name}" from the menu?`, async () => {
      setDeleting(true);
      setActionError('');
      try {
        await menuApi.remove(item._id);
        navigation.goBack();
      } catch (err) {
        // e.g. 409 when active orders still contain this item
        setActionError(err.message);
        setDeleting(false);
      }
    });

  if (loading) return <LoadingView />;
  if (error) return <ErrorView message={error} onRetry={load} />;

  const maxQty = Math.min(20, item.stockQuantity);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {item.imageUrl ? (
        <Image source={{ uri: imageUri(item.imageUrl) }} style={{ width: '100%', height: 220, borderRadius: 12 }} resizeMode="cover" />
      ) : (
        <View style={{ height: 160, borderRadius: 12, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 60 }}>🍽️</Text>
        </View>
      )}

      <Text style={[styles.title, { marginTop: spacing.lg }]}>{item.name}</Text>
      <Text style={styles.muted}>{item.category}</Text>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.primary, marginTop: spacing.sm }}>{formatPrice(item.price)}</Text>
      {item.description ? <Text style={{ marginTop: spacing.md, lineHeight: 22 }}>{item.description}</Text> : null}

      <View style={[styles.card, { marginTop: spacing.lg }]}>
        <Text>
          Status:{' '}
          <Text style={{ fontWeight: '700', color: item.isAvailable ? colors.success : colors.danger }}>
            {item.isAvailable ? 'Available' : 'Unavailable'}
          </Text>
        </Text>
        <Text style={styles.muted}>Portions left today: {item.stockQuantity}</Text>
      </View>

      <Banner message={message} type="success" />
      <Banner message={actionError} />

      {isAdmin ? (
        <>
          <Button title="Edit item" onPress={() => navigation.navigate('MenuForm', { id: item._id })} />
          <Button title="Delete item" variant="danger" onPress={onDelete} loading={deleting} style={{ marginTop: spacing.md }} />
        </>
      ) : item.isAvailable && maxQty > 0 ? (
        <>
          <View style={[styles.row, { marginBottom: spacing.md }]}>
            <Text style={styles.subtitle}>Quantity</Text>
            <QuantityStepper value={quantity} onChange={setQuantity} max={maxQty} />
          </View>
          <Button title={`Add to cart · ${formatPrice(item.price * quantity)}`} onPress={onAdd} />
          <Button title="Go to cart" variant="outline" onPress={() => navigation.navigate('Main', { screen: 'Cart' })} style={{ marginTop: spacing.md }} />
        </>
      ) : (
        <Text style={{ color: colors.danger, textAlign: 'center' }}>This dish cannot be ordered right now.</Text>
      )}
    </ScrollView>
  );
}
