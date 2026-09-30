import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { menuApi } from '../../api';
import { imageUri } from '../../api/client';
import { Banner, Button, ErrorView, FormInput, LoadingView, styles } from '../../components/ui';
import { colors, spacing } from '../../theme';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Used for both "Add menu item" (no id) and "Edit menu item" (route.params.id)
export default function MenuFormScreen({ route, navigation }) {
  const id = route.params?.id;
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stockQuantity: '',
    isAvailable: true,
  });
  const [categories, setCategories] = useState([]);
  const [existingImage, setExistingImage] = useState(null);
  const [pickedImage, setPickedImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Edit menu item' : 'Add menu item' });

    (async () => {
      try {
        setCategories(await menuApi.categories());
        if (isEdit) {
          const item = await menuApi.get(id);
          setForm({
            name: item.name,
            description: item.description || '',
            category: item.category,
            price: String(item.price),
            stockQuantity: String(item.stockQuantity),
            isAvailable: item.isAvailable,
          });
          setExistingImage(item.imageUrl);
        }
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit, navigation]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    const type = asset.mimeType || 'image/jpeg';
    // Check type and size on the phone too, so a bad file is never uploaded
    if (!ALLOWED_TYPES.includes(type)) {
      setErrors((e) => ({ ...e, image: 'Only JPEG, PNG or WEBP images are allowed' }));
      return;
    }
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
      setErrors((e) => ({ ...e, image: 'Image must be 2 MB or smaller' }));
      return;
    }
    setErrors((e) => ({ ...e, image: undefined }));
    setPickedImage({ ...asset, mimeType: type });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.category) e.category = 'Choose a category';
    const price = Number(form.price);
    if (form.price === '' || Number.isNaN(price) || price < 0) e.price = 'Enter a valid price (0 or more)';
    const stock = Number(form.stockQuantity);
    if (form.stockQuantity === '' || !Number.isInteger(stock) || stock < 0) e.stockQuantity = 'Enter a whole number (0 or more)';
    if (form.description.length > 500) e.description = 'Keep the description under 500 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSave = async () => {
    setServerError('');
    if (!validate()) return;
    setSaving(true);
    const fields = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      price: Number(form.price),
      stockQuantity: Number(form.stockQuantity),
      isAvailable: form.isAvailable,
    };
    try {
      if (isEdit) await menuApi.update(id, fields, pickedImage);
      else await menuApi.create(fields, pickedImage);
      navigation.goBack();
    } catch (err) {
      setServerError(err.message);
      setSaving(false);
    }
  };

  if (loading) return <LoadingView />;
  if (loadError) return <ErrorView message={loadError} onRetry={() => navigation.goBack()} />;

  const previewUri = pickedImage?.uri || imageUri(existingImage);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Banner message={serverError} />

        <Pressable onPress={pickImage} style={{ alignItems: 'center', marginBottom: spacing.md }}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} style={{ width: '100%', height: 180, borderRadius: 12 }} />
          ) : (
            <View style={{ width: '100%', height: 140, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 32 }}>📷</Text>
            </View>
          )}
          <Text style={{ color: colors.primary, fontWeight: '600', marginTop: spacing.sm }}>
            {previewUri ? 'Change photo' : 'Add photo (optional)'}
          </Text>
          {errors.image ? <Text style={styles.errorText}>{errors.image}</Text> : null}
        </Pressable>

        <FormInput label="Name" value={form.name} onChangeText={set('name')} error={errors.name} />
        <FormInput label="Description" value={form.description} onChangeText={set('description')} multiline error={errors.description} />

        <Text style={styles.label}>Category</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: errors.category ? 0 : spacing.md }}>
          {categories.map((c) => {
            const active = form.category === c;
            return (
              <Pressable
                key={c}
                onPress={() => set('category')(c)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? colors.primary : '#fff',
                  marginRight: spacing.sm,
                  marginBottom: spacing.sm,
                }}
              >
                <Text style={{ color: active ? '#fff' : colors.text }}>{c}</Text>
              </Pressable>
            );
          })}
        </View>
        {errors.category ? <Text style={[styles.errorText, { marginBottom: spacing.md }]}>{errors.category}</Text> : null}

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <FormInput style={{ flex: 1 }} label="Price (Rs.)" value={form.price} onChangeText={set('price')} keyboardType="decimal-pad" error={errors.price} />
          <FormInput style={{ flex: 1 }} label="Portions in stock" value={form.stockQuantity} onChangeText={set('stockQuantity')} keyboardType="number-pad" error={errors.stockQuantity} />
        </View>

        <View style={[styles.row, styles.card]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.subtitle}>Available for ordering</Text>
            <Text style={styles.muted}>Turns off automatically when stock is 0</Text>
          </View>
          <Switch value={form.isAvailable} onValueChange={set('isAvailable')} trackColor={{ true: colors.primary }} />
        </View>

        <Button title={isEdit ? 'Save changes' : 'Create item'} onPress={onSave} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
