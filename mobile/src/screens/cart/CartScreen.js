import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { orderApi } from '../../api';
import { useCart } from '../../context/CartContext';
import { Banner, Button, EmptyState, FormInput, QuantityStepper, styles } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { formatPrice } from '../../utils/format';

export default function CartScreen({ navigation }) {
  const { lines, estimatedTotal, setQuantity, clear } = useCart();
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [placing, setPlacing] = useState(false);

  if (lines.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        message="Browse the menu and add something tasty."
        actionTitle="Browse menu"
        onAction={() => navigation.navigate('Menu')}
      />
    );
  }

  const validate = () => {
    const e = {};
    if (!address.trim()) e.address = 'Delivery address is required';
    else if (address.trim().length < 5) e.address = 'Please enter a full address';
    if (notes.length > 300) e.notes = 'Notes must be 300 characters or fewer';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async () => {
    setServerError('');
    if (!validate()) return;
    setPlacing(true);
    try {
      // Only ids and quantities are sent - the server looks up prices and works out the total
      const order = await orderApi.create({
        items: lines.map((l) => ({ menuItem: l.item._id, quantity: l.quantity })),
        deliveryAddress: address.trim(),
        notes: notes.trim(),
      });
      clear();
      setAddress('');
      setNotes('');
      navigation.navigate('OrderDetail', { id: order._id });
    } catch (err) {
      // e.g. 409 "Only 2 portion(s) of Chicken Kottu left"
      setServerError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {lines.map(({ item, quantity }) => (
          <View key={item._id} style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.subtitle}>{item.name}</Text>
                <Text style={styles.muted}>{formatPrice(item.price)} each</Text>
              </View>
              <QuantityStepper value={quantity} min={0} onChange={(q) => setQuantity(item._id, q)} />
            </View>
            <Text style={{ textAlign: 'right', marginTop: spacing.sm, fontWeight: '600' }}>{formatPrice(item.price * quantity)}</Text>
          </View>
        ))}

        <View style={[styles.row, { marginVertical: spacing.md }]}>
          <Text style={styles.subtitle}>Estimated total</Text>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.primary }}>{formatPrice(estimatedTotal)}</Text>
        </View>

        <FormInput label="Delivery address" value={address} onChangeText={setAddress} placeholder="No. 12, Main Street, Malabe" error={errors.address} />
        <FormInput label="Notes for the kitchen (optional)" value={notes} onChangeText={setNotes} multiline placeholder="Less spicy, no onions..." error={errors.notes} />

        <Banner message={serverError} />
        <Button title="Place order" onPress={placeOrder} loading={placing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
