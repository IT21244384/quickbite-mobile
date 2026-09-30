import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { LoadingView } from '../components/ui';
import { colors } from '../theme';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import MenuListScreen from '../screens/menu/MenuListScreen';
import MenuDetailScreen from '../screens/menu/MenuDetailScreen';
import MenuFormScreen from '../screens/menu/MenuFormScreen';
import CartScreen from '../screens/cart/CartScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import EditOrderScreen from '../screens/orders/EditOrderScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const tabIcon = (emoji) => ({ focused }) => <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>;

// Bottom tabs. Admins do not order food, so they get no Cart tab.
function MainTabs() {
  const { isAdmin } = useAuth();
  const { count } = useCart();

  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: colors.primary, headerTitleStyle: { fontWeight: '700' } }}>
      <Tab.Screen name="Menu" component={MenuListScreen} options={{ title: isAdmin ? 'Manage menu' : 'Menu', tabBarIcon: tabIcon('🍛') }} />
      {!isAdmin && (
        <Tab.Screen
          name="Cart"
          component={CartScreen}
          options={{ tabBarIcon: tabIcon('🛒'), tabBarBadge: count > 0 ? count : undefined }}
        />
      )}
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: isAdmin ? 'All orders' : 'My orders', tabBarIcon: tabIcon('🧾') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: tabIcon('👤') }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, booting } = useAuth();

  if (booting) return <LoadingView message="Starting QuickBite..." />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerTintColor: colors.primary, contentStyle: { backgroundColor: colors.background } }}>
        {user ? (
          // Protected area: only reachable with a valid token
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="MenuDetail" component={MenuDetailScreen} options={{ title: 'Dish' }} />
            <Stack.Screen name="MenuForm" component={MenuFormScreen} options={{ title: 'Menu item' }} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order' }} />
            <Stack.Screen name="EditOrder" component={EditOrderScreen} options={{ title: 'Edit order' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Register' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
