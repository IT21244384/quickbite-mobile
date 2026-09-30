import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { orderApi } from '../../api';
import { Banner, Button, ErrorView, FormInput, LoadingView, QuantityStepper, styles } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { formatPrice } from '../../utils/format';

// Lets the customer change quantities, remove lines, or fix the address/notes
// while the order is still Pending. The server re-checks stock and recalculates the total.
export default function EditOrderScreen({ route, navigation }) {
  const { id } = route.params;
  const [items, setItems] = useState([]);
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const order = await orderApi.get(id);
        setItems(order.items);
        setAddress(order.deliveryAddress);
        setNotes(order.notes || '');
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const setQty = (menuItem, quantity) =>
    setItems((prev) => prev.map((i) => (i.menuItem === menuItem ? { ...i, quantity } : i)));
  const removeLine = (menuItem) => setItems((prev) => prev.filter((i) => i.menuItem !== menuItem));

  const validate = () => {
    const e = {};
    if (items.length === 0) e.items = 'An order needs at least one item. Cancel the order instead.';
    if (!address.trim()) e.address = 'Delivery address is required';
    if (notes.length > 300) e.notes = 'Notes must be 300 characters or fewer';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    setServerError('');
    if (!validate()) return;
    setSaving(true);
    try {
      await orderApi.update(id, {
        items: items.map((i) => ({ menuItem: i.menuItem, quantity: i.quantity })),
        deliveryAddress: address.trim(),
        notes: notes.trim(),
      });
      navigation.goBack();
    } catch (err) {
      setServerError(err.message);
      setSaving(false);
    }
  };

  if (loading) return <LoadingView />;
  if (loadError) return <ErrorView message={loadError} />;

  const estimate = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {items.map((i) => (
          <View key={i.menuItem} style={styles.card}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.subtitle}>{i.name}</Text>
                <Text style={styles.muted}>{formatPrice(i.unitPrice)} each</Text>
              </View>
              <QuantityStepper value={i.quantity} onChange={(q) => setQty(i.menuItem, q)} />
            </View>
            <Pressable onPress={() => removeLine(i.menuItem)} style={{ marginTop: spacing.sm, alignSelf: 'flex-end' }}>
              <Text style={{ color: colors.danger }}>Remove</Text>
            </Pressable>
          </View>
        ))}
        {errors.items ? <Text style={[styles.errorText, { marginBottom: spacing.md }]}>{errors.items}</Text> : null}

        <View style={[styles.row, { marginBottom: spacing.md }]}>
          <Text style={styles.subtitle}>New total (estimate)</Text>
          <Text style={{ fontWeight: '700', color: colors.primary }}>{formatPrice(estimate)}</Text>
        </View>

        <FormInput label="Delivery address" value={address} onChangeText={setAddress} error={errors.address} />
        <FormInput label="Notes" value={notes} onChangeText={setNotes} multiline error={errors.notes} />

        <Banner message={serverError} />
        <Button title="Save changes" onPress={onSave} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
