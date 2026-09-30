import { createContext, useContext, useMemo, useState } from 'react';

// The cart lives only in app memory until the customer places the order.
// Prices here are for display only - the server recalculates the real total.
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [lines, setLines] = useState([]); // [{ item, quantity }]

  const addItem = (item, quantity) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.item._id === item._id);
      if (existing) {
        return prev.map((l) =>
          l.item._id === item._id ? { ...l, quantity: Math.min(20, l.quantity + quantity) } : l
        );
      }
      return [...prev, { item, quantity }];
    });
  };

  const setQuantity = (itemId, quantity) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.item._id !== itemId)
        : prev.map((l) => (l.item._id === itemId ? { ...l, quantity } : l))
    );
  };

  const clear = () => setLines([]);

  const value = useMemo(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const estimatedTotal = lines.reduce((sum, l) => sum + l.item.price * l.quantity, 0);
    return { lines, count, estimatedTotal, addItem, setQuantity, clear };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return useContext(CartContext);
}
