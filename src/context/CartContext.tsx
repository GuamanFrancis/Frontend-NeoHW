import React, { createContext, useContext, useState, useEffect } from 'react';
import type { CatalogComponent } from '../types/catalog';
import { getStoredSession } from '../services/session';
import {
  getCart,
  addToCart as addToCartApi,
  updateCartItem,
  removeCartItem,
} from '../services/cartService';

export type CartItem = {
  id?: string;
  product: CatalogComponent;
  quantity: number;
};

type CartContextType = {
  cartItems: CartItem[];
  addToCart: (product: CatalogComponent) => Promise<void>;
  addMultipleToCart: (products: CatalogComponent[]) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: (localOnly?: boolean) => Promise<void>;
  subtotal: number;
  taxes: number;
  total: number;
  itemCount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [userId, setUserId] = useState<string | undefined>(() => getStoredSession()?.user.id);

  const syncBackendCart = async () => {
    try {
      const items = await getCart();
      setCartItems(items);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const handleSessionChange = () => {
      const activeSession = getStoredSession();
      setUserId(activeSession?.user.id);
    };
    window.addEventListener('neohw-session-change', handleSessionChange);
    return () => {
      window.removeEventListener('neohw-session-change', handleSessionChange);
    };
  }, []);

  useEffect(() => {
    const initializeCart = async () => {
      if (userId) {
        try {
          const storedCart = localStorage.getItem('neohw_cart');
          if (storedCart) {
            const parsed = JSON.parse(storedCart);
            if (Array.isArray(parsed) && parsed.length > 0) {
              for (const item of parsed) {
                if (item.product?.id) {
                  await addToCartApi(item.product.id, Number(item.quantity) || 1);
                }
              }
            }
            localStorage.removeItem('neohw_cart');
          }
          const serverItems = await getCart();
          setCartItems(serverItems);
        } catch (error) {
          console.error(error);
          try {
            const serverItems = await getCart();
            setCartItems(serverItems);
          } catch {
            setCartItems([]);
          }
        }
      } else {
        try {
          const storedCart = localStorage.getItem('neohw_cart');
          if (storedCart) {
            const parsed = JSON.parse(storedCart);
            if (Array.isArray(parsed)) {
              setCartItems(
                parsed.map((item: any) => ({
                  ...item,
                  quantity: Number(item.quantity) || 1,
                }))
              );
              return;
            }
          }
        } catch {}
        setCartItems([]);
      }
    };

    void initializeCart();
  }, [userId]);

  useEffect(() => {
    const activeSession = getStoredSession();
    if (!activeSession) {
      try {
        localStorage.setItem('neohw_cart', JSON.stringify(cartItems));
      } catch (error) {
        console.error(error);
      }
    }
  }, [cartItems]);

  const addToCart = async (product: CatalogComponent) => {
    const activeSession = getStoredSession();
    if (activeSession) {
      try {
        const existingItem = cartItems.find((item) => item.product.id === product.id);
        if (existingItem) {
          const currentQty = Number(existingItem.quantity);
          if (currentQty < product.stock) {
            await addToCartApi(product.id, 1);
            await syncBackendCart();
          }
        } else if (product.stock > 0) {
          await addToCartApi(product.id, 1);
          await syncBackendCart();
        }
      } catch (error) {
        console.error(error);
      }
    } else {
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
    }
  };

  const addMultipleToCart = async (products: CatalogComponent[]) => {
    const activeSession = getStoredSession();
    if (activeSession) {
      try {
        for (const product of products) {
          const existingItem = cartItems.find((item) => item.product.id === product.id);
          if (existingItem) {
            const currentQty = Number(existingItem.quantity);
            if (currentQty < product.stock) {
              await addToCartApi(product.id, 1);
            }
          } else if (product.stock > 0) {
            await addToCartApi(product.id, 1);
          }
        }
        await syncBackendCart();
      } catch (error) {
        console.error(error);
      }
    } else {
      setCartItems((prevItems) => {
        const currentItems = [...prevItems];
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
    }
  };

  const removeFromCart = async (productId: string) => {
    const activeSession = getStoredSession();
    if (activeSession) {
      const item = cartItems.find((i) => i.product.id === productId);
      if (item && item.id) {
        try {
          await removeCartItem(item.id);
          await syncBackendCart();
        } catch (error) {
          console.error(error);
        }
      }
    } else {
      setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId));
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    const numericQty = Number(quantity);
    if (numericQty < 1) return;
    const activeSession = getStoredSession();
    if (activeSession) {
      const item = cartItems.find((i) => i.product.id === productId);
      if (item && item.id) {
        try {
          const finalQuantity = Math.min(numericQty, item.product.stock);
          await updateCartItem(item.id, finalQuantity);
          await syncBackendCart();
        } catch (error) {
          console.error(error);
        }
      }
    } else {
      setCartItems((prevItems) =>
        prevItems.map((item) => {
          if (item.product.id === productId) {
            const finalQuantity = Math.min(numericQty, item.product.stock);
            return { ...item, quantity: finalQuantity };
          }
          return item;
        })
      );
    }
  };

  const clearCart = async (localOnly = false) => {
    const activeSession = getStoredSession();
    if (activeSession && !localOnly) {
      try {
        const deletePromises = cartItems
          .filter((item) => item.id)
          .map((item) => removeCartItem(item.id!));
        await Promise.all(deletePromises);
        setCartItems([]);
      } catch (error) {
        console.error(error);
      }
    } else {
      setCartItems([]);
    }
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
