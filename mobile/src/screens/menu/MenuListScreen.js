import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { FlatList, Image, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { menuApi } from '../../api';
import { imageUri } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { EmptyState, ErrorView, LoadingView, styles } from '../../components/ui';
import { colors, spacing } from '../../theme';
import { formatPrice } from '../../utils/format';

export default function MenuListScreen({ navigation }) {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Admins get a "+ Add" button in the header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: isAdmin
        ? () => (
            <Pressable onPress={() => navigation.navigate('MenuForm')} style={{ paddingHorizontal: spacing.md }}>
              <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>+ Add</Text>
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, isAdmin]);

  const load = useCallback(async () => {
    try {
      setError('');
      const data = await menuApi.list({ category, search: search.trim() });
      setItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [category, search]);

  useEffect(() => {
    menuApi.categories().then(setCategories).catch(() => {});
  }, []);

  // Reload whenever the screen comes back into focus (e.g. after editing an item)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const renderItem = ({ item }) => (
    <Pressable onPress={() => navigation.navigate('MenuDetail', { id: item._id })} style={[styles.card, { flexDirection: 'row' }]}>
      {item.imageUrl ? (
        <Image source={{ uri: imageUri(item.imageUrl) }} style={{ width: 84, height: 84, borderRadius: 8 }} />
      ) : (
        <View style={{ width: 84, height: 84, borderRadius: 8, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 30 }}>🍽️</Text>
        </View>
      )}
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <Text style={styles.subtitle}>{item.name}</Text>
        <Text style={styles.muted}>{item.category}</Text>
        <View style={[styles.row, { marginTop: spacing.sm }]}>
          <Text style={{ fontWeight: '700', color: colors.primary }}>{formatPrice(item.price)}</Text>
          {item.isAvailable ? (
            <Text style={{ color: colors.success, fontSize: 12 }}>{item.stockQuantity} left</Text>
          ) : (
            <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '600' }}>Unavailable</Text>
          )}
        </View>
      </View>
    </Pressable>
  );

  if (loading) return <LoadingView message="Loading menu..." />;

  return (
    <View style={styles.screen}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search dishes..."
          placeholderTextColor={colors.muted}
          style={styles.input}
          returnKeyType="search"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: spacing.sm }}>
          {['', ...categories].map((c) => {
            const active = c === category;
            return (
              <Pressable
                key={c || 'all'}
                onPress={() => setCategory(c)}
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
                <Text style={{ color: active ? '#fff' : colors.text }}>{c || 'All'}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {error ? (
        <ErrorView message={error} onRetry={load} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i._id}
          renderItem={renderItem}
          contentContainerStyle={[styles.content, items.length === 0 && { flexGrow: 1 }]}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={
            <EmptyState
              title="No dishes found"
              message={isAdmin ? 'Add your first menu item.' : 'Try a different search or category.'}
              actionTitle={isAdmin ? 'Add menu item' : undefined}
              onAction={() => navigation.navigate('MenuForm')}
            />
          }
        />
      )}
    </View>
  );
}
