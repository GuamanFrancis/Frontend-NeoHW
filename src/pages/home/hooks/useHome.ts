import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { getCatalogComponents } from '../../../services/catalogService';
import type { CatalogComponent } from '../../../types/catalog';
import { useCart } from '../../../context/CartContext';
import { getStoredSession } from '../../../services/session';
import { roleHomeRoutes } from '../../../services/authService';

const categories = [
  { name: 'Procesadores', slug: 'procesadores' },
  { name: 'Tarjetas gráficas', slug: 'tarjetas-graficas' },
  { name: 'Placas base', slug: 'placas-madre' },
  { name: 'Memorias RAM', slug: 'memorias-ram' },
  { name: 'Almacenamiento', slug: 'almacenamiento' },
  { name: 'Fuentes de poder', slug: 'fuentes-de-poder' },
];

export const useHome = () => {
  const { addToCart } = useCart();
  const session = getStoredSession();
  const navigate = useNavigate();

  const [categoryProducts, setCategoryProducts] = useState<Record<string, CatalogComponent[]>>({});
  const [loading, setLoading] = useState(true);
  const [cartSuccessMessage, setCartSuccessMessage] = useState<string | null>(null);

  const [selectedComponent, setSelectedComponent] = useState<CatalogComponent | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [triggerType, setTriggerType] = useState<'click' | 'hover'>('click');
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleMouseEnterCard = useCallback((item: CatalogComponent, event: React.MouseEvent) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
    }
    const rect = event.currentTarget.getBoundingClientRect();
    hoverTimerRef.current = setTimeout(() => {
      setTriggerType('hover');
      setAnchorRect(rect);
      setSelectedComponent(item);
      setIsDrawerOpen(true);
    }, 2000);
  }, []);

  const handleMouseLeaveCard = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setTriggerType((prevTrigger) => {
      setIsDrawerOpen((prevIsOpen) => {
        if (prevIsOpen && prevTrigger === 'hover') {
          closeTimerRef.current = setTimeout(() => {
            setIsDrawerOpen(false);
            setSelectedComponent(null);
          }, 300);
        }
        return prevIsOpen;
      });
      return prevTrigger;
    });
  }, []);

  const handleMouseEnterPopup = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const handleMouseLeavePopup = useCallback(() => {
    if (triggerType === 'hover') {
      closeTimerRef.current = setTimeout(() => {
        setIsDrawerOpen(false);
        setSelectedComponent(null);
      }, 300);
    }
  }, [triggerType]);

  useEffect(() => {
    const fetchAllCategoriesProducts = async () => {
      setLoading(true);
      const tempProducts: Record<string, CatalogComponent[]> = {};
      try {
        const promises = categories.map(async (cat) => {
          try {
            const response = await getCatalogComponents({ category: cat.slug, limit: 4 });
            if (response.items && response.items.length > 0) {
              tempProducts[cat.slug] = response.items;
            }
          } catch (error) {
            console.error(error);
          }
        });
        await Promise.all(promises);
      } finally {
        setCategoryProducts(tempProducts);
        setLoading(false);
      }
    };
    void fetchAllCategoriesProducts();
  }, []);

  useEffect(() => {
    const scrollToSection = sessionStorage.getItem('scroll-to-section');
    if (scrollToSection) {
      sessionStorage.removeItem('scroll-to-section');
      setTimeout(() => {
        const el = document.getElementById(scrollToSection);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 150);
    }
  }, []);

  const handleAddToCart = useCallback((product: CatalogComponent) => {
    addToCart(product);
    navigate('/cliente/carrito');
  }, [addToCart, navigate]);

  const handleOpenDrawer = useCallback((product: CatalogComponent) => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setTriggerType('click');
    setAnchorRect(null);
    setSelectedComponent(product);
    setIsDrawerOpen(true);
  }, []);

  const dashboardPath = session ? roleHomeRoutes[session.user.role] : '/login';

  return {
    categoryProducts,
    loading,
    cartSuccessMessage,
    selectedComponent,
    isDrawerOpen,
    triggerType,
    anchorRect,
    handleMouseEnterCard,
    handleMouseLeaveCard,
    handleMouseEnterPopup,
    handleMouseLeavePopup,
    handleAddToCart,
    handleOpenDrawer,
    setIsDrawerOpen,
    setSelectedComponent,
    dashboardPath,
    session,
  };
};
