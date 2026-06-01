import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CatalogComponent } from '../types/catalog';

export type CartItem = {
  product: CatalogComponent;
  quantity: number;
};

type CartContextType = {
  cartItems: CartItem[];
  addToCart: (product: CatalogComponent) => void;
  addMultipleToCart: (products: CatalogComponent[]) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  taxes: number;
  total: number;
  itemCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const storedCart = localStorage.getItem('neohw_cart');
      if (storedCart) {
        const parsed = JSON.parse(storedCart);
        if (Array.isArray(parsed)) {
          return parsed.map((item: any) => ({
            ...item,
            quantity: Number(item.quantity) || 1,
          }));
        }
      }
      return [];
    } catch (error) {
      console.error('Error al cargar el carrito de localStorage:', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('neohw_cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error al guardar el carrito en localStorage:', error);
    }
  }, [cartItems]);

  const addToCart = (product: CatalogComponent) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id);
      if (existingItem) {
        const currentQty = Number(existingItem.quantity);
        if (currentQty < product.stock) {
          return prevItems.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: currentQty + 1 }
              : item
          );
        }
        return prevItems;
      }
      if (product.stock > 0) {
        return [...prevItems, { product, quantity: 1 }];
      }
      return prevItems;
    });
  };

  const addMultipleToCart = (products: CatalogComponent[]) => {
    setCartItems((prevItems) => {
      let currentItems = [...prevItems];
      products.forEach((product) => {
        const existingItemIndex = currentItems.findIndex((item) => item.product.id === product.id);
        if (existingItemIndex > -1) {
          const existingItem = currentItems[existingItemIndex];
          const currentQty = Number(existingItem.quantity);
          if (currentQty < product.stock) {
            currentItems[existingItemIndex] = {
              ...existingItem,
              quantity: currentQty + 1,
            };
          }
        } else if (product.stock > 0) {
          currentItems.push({ product, quantity: 1 });
        }
      });
      return currentItems;
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const numericQty = Number(quantity);
    if (numericQty < 1) return;
    setCartItems((prevItems) =>
      prevItems.map((item) => {
        if (item.product.id === productId) {
          const finalQuantity = Math.min(numericQty, item.product.stock);
          return { ...item, quantity: finalQuantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * Number(item.quantity), 0);
  const taxes = subtotal * 0.15;
  const total = subtotal + taxes;
  const itemCount = cartItems.reduce((acc, item) => acc + Number(item.quantity), 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        addMultipleToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        taxes,
        total,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};
