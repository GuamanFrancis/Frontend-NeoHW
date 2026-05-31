import { useEffect, useMemo, useState } from 'react';
import {
  createCatalogComponent,
  deleteCatalogComponent,
  getCatalogComponents,
  updateCatalogComponent,
} from '../../../services/catalogService';
import { getCategories, getLeafCategories, createCategory, deleteCategory } from '../../../services/categoryService';
import type { BackendCategory, CatalogComponent, CatalogSavePayload, CatalogStockStatus } from '../../../types/catalog';
import {
  getAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute,
  getAttributesByCategory,
  associateAttributeToCategory,
  removeAttributeFromCategory,
  getProductAttributes,
  setProductAttributes,
  type BackendAttribute,
  type AttributeDataType,
} from '../../../services/attributesService';
import {
  getCompatibilityRules,
  createCompatibilityRule,
  deleteCompatibilityRule,
  type CompatibilityRule,
} from '../../../services/compatibilityService';

export type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

export type CatalogFormValues = {
  name: string;
  description: string;
  categoryId: string;
  brand: string;
  price: string;
  stock: string;
  imageUrl: string;
};

export const emptyForm: CatalogFormValues = {
  name: '',
  description: '',
  categoryId: '',
  brand: '',
  price: '',
  stock: '',
  imageUrl: '',
};

export const statusMeta: Record<CatalogStockStatus, { label: string; className: string }> = {
  disponible: {
    label: 'Disponible',
    className:
      'border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  'stock-bajo': {
    label: 'Stock bajo',
    className:
      'border-amber-400/40 bg-amber-400/10 text-amber-700 dark:border-amber-500/30 dark:bg-emerald-500/10 dark:text-amber-300',
  },
  agotado: {
    label: 'Agotado',
    className: 'border-red-400/40 bg-red-400/10 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300',
  },
};

export const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);

export const getVisiblePages = (totalPages: number, currentPage: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push('ellipsis');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push('ellipsis');
  pages.push(totalPages);

  return pages;
};

export const mapComponentToForm = (component: CatalogComponent): CatalogFormValues => ({
  name: component.name,
  description: component.description,
  categoryId: component.categoryId,
  brand: component.brand,
  price: component.price.toString(),
  stock: component.stock.toString(),
  imageUrl: component.imageUrl ?? '',
});

export const useAdminCatalog = () => {
  const [components, setComponents] = useState<CatalogComponent[]>([]);
  const [categories, setCategories] = useState<BackendCategory[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | CatalogStockStatus>('todos');
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedComponent, setSelectedComponent] = useState<CatalogComponent | null>(null);
  const [formValues, setFormValues] = useState<CatalogFormValues>(emptyForm);
  const [loadError, setLoadError] = useState('');

  const [activeTab, setActiveTab] = useState<'componentes' | 'atributos' | 'categorias' | 'reglas'>('componentes');
  const [catModalMode, setCatModalMode] = useState<'create' | null>(null);
  const [isSavingCat, setIsSavingCat] = useState(false);
  const [catModalError, setCatModalError] = useState('');
  const [catToDelete, setCatToDelete] = useState<BackendCategory | null>(null);
  const [catForm, setCatForm] = useState({
    name: '',
    description: '',
    parentId: '',
  });
  const [compatibilityRulesList, setCompatibilityRulesList] = useState<CompatibilityRule[]>([]);
  const [ruleModalMode, setRuleModalMode] = useState<'create' | null>(null);
  const [isSavingRule, setIsSavingRule] = useState(false);
  const [ruleModalError, setRuleModalError] = useState('');
  const [ruleToDelete, setRuleToDelete] = useState<CompatibilityRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    sourceAttributeId: '',
    targetAttributeId: '',
    ruleType: 'MUST_MATCH' as 'MUST_MATCH' | 'RANGE_CHECK' | 'POWER_SUFFICIENT' | 'CUSTOM',
    operator: 'EQUALS',
  });
  const [globalAttributes, setGlobalAttributes] = useState<BackendAttribute[]>([]);
  const [selectedCategoryIdForAttr, setSelectedCategoryIdForAttr] = useState<string>('');
  const [categoryAttrs, setCategoryAttrs] = useState<BackendAttribute[]>([]);
  const [attrModalMode, setAttrModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedAttribute, setSelectedAttribute] = useState<BackendAttribute | null>(null);
  const [attrForm, setAttrForm] = useState({
    name: '',
    slug: '',
    dataType: 'TEXT' as AttributeDataType,
    unit: '',
    optionsString: '',
  });
  const [attrModalError, setAttrModalError] = useState('');
  const [isSavingAttr, setIsSavingAttr] = useState(false);

  const [categoryAttributesToFill, setCategoryAttributesToFill] = useState<BackendAttribute[]>([]);
  const [productAttributesValues, setProductAttributesValues] = useState<Record<string, string>>({});

  const [attrToDelete, setAttrToDelete] = useState<BackendAttribute | null>(null);
  const [attrToDisassociate, setAttrToDisassociate] = useState<BackendAttribute | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          getCatalogComponents({ page: 1, limit: 100 }),
          getCategories(),
        ]);

        if (!isMounted) return;
        setComponents(productsRes.items);
        setCategories(categoriesRes);
        setLoadError('');
      } catch {
        if (!isMounted) return;
        setLoadError('No se pudo conectar con el backend. Verifica la conexion e intenta de nuevo.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'atributos') {
      const loadAttributesData = async () => {
        try {
          const attrs = await getAttributes();
          setGlobalAttributes(attrs);
        } catch (err) {
          console.error(err);
        }
      };
      void loadAttributesData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'reglas') {
      const loadRulesData = async () => {
        try {
          const [rulesRes, attrs] = await Promise.all([
            getCompatibilityRules(),
            getAttributes(),
          ]);
          setCompatibilityRulesList(rulesRes.data);
          setGlobalAttributes(attrs);
        } catch (err) {
          console.error(err);
        }
      };
      void loadRulesData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'categorias') {
      const loadCategoriesData = async () => {
        try {
          const cats = await getCategories();
          setCategories(cats);
        } catch (err) {
          console.error(err);
        }
      };
      void loadCategoriesData();
    }
  }, [activeTab]);

  useEffect(() => {
    const loadCategoryAttrs = async () => {
      if (!selectedCategoryIdForAttr) {
        setCategoryAttrs([]);
        return;
      }
      try {
        const attrs = await getAttributesByCategory(selectedCategoryIdForAttr);
        setCategoryAttrs(attrs);
      } catch (err) {
        console.error(err);
      }
    };
    void loadCategoryAttrs();
  }, [selectedCategoryIdForAttr]);

  const leafCategories = useMemo(() => getLeafCategories(categories), [categories]);

  const categorySelectOptions = useMemo(
    () => [
      { label: 'Selecciona una categoria', value: '' },
      ...leafCategories.map((cat) => ({ label: cat.name, value: cat.id })),
    ],
    [leafCategories],
  );

  const categoryFilterOptions = useMemo(() => {
    const names = Array.from(
      new Set(
        components
          .map((c) => c.category.trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));

    return [
      { label: 'Todas las categorias', value: 'todos' },
      ...names.map((name) => ({ label: name, value: name })),
    ];
  }, [components]);

  const filteredComponents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return components.filter((component) => {
      const matchesSearch =
        !normalizedSearch ||
        component.name.toLowerCase().includes(normalizedSearch) ||
        component.description.toLowerCase().includes(normalizedSearch) ||
        component.brand.toLowerCase().includes(normalizedSearch);
      const matchesCategory = categoryFilter === 'todos' || component.category === categoryFilter;
      const matchesStatus = statusFilter === 'todos' || component.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [categoryFilter, components, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredComponents.length / pageSize));
  const pageComponents = filteredComponents.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const firstResult = filteredComponents.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastResult = Math.min(currentPage * pageSize, filteredComponents.length);
  const pagesToShow = getVisiblePages(totalPages, currentPage);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const resetFilters = () => {
    setSearch('');
    setCategoryFilter('todos');
    setStatusFilter('todos');
    setCurrentPage(1);
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedComponent(null);
    setFormValues(emptyForm);
    setCategoryAttributesToFill([]);
    setProductAttributesValues({});
    setModalError('');
    setIsSaving(false);
  };

  const openCreateModal = () => {
    setModalError('');
    setFormValues(emptyForm);
    setCategoryAttributesToFill([]);
    setProductAttributesValues({});
    setSelectedComponent(null);
    setModalMode('create');
  };

  const openEditModal = async (component: CatalogComponent) => {
    setModalError('');
    setSelectedComponent(component);
    setFormValues(mapComponentToForm(component));
    setModalMode('edit');
    try {
      const attrs = await getAttributesByCategory(component.categoryId);
      setCategoryAttributesToFill(attrs);
      const detailedAttrs = await getProductAttributes(component.id);
      const initialValues: Record<string, string> = {};
      detailedAttrs.forEach((da) => {
        initialValues[da.attribute.id] = da.value;
      });
      setProductAttributesValues(initialValues);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCategoryChange = async (categoryId: string) => {
    setFormValues((current) => ({ ...current, categoryId }));
    setProductAttributesValues({});
    if (!categoryId) {
      setCategoryAttributesToFill([]);
      return;
    }
    try {
      const attrs = await getAttributesByCategory(categoryId);
      setCategoryAttributesToFill(attrs);
    } catch (e) {
      console.error(e);
    }
  };

  const openViewModal = async (component: CatalogComponent) => {
    setSelectedComponent(component);
    setModalMode('view');
    try {
      const detailedAttrs = await getProductAttributes(component.id);
      setSelectedComponent(curr => curr ? {
        ...curr,
        attributes: detailedAttrs.map(da => ({
          name: da.attribute.name,
          value: da.value,
          unit: da.attribute.unit,
        })),
      } : null);
    } catch (e) {
      console.error(e);
    }
  };

  const openDeleteModal = (component: CatalogComponent) => {
    setModalError('');
    setSelectedComponent(component);
    setModalMode('delete');
  };

  const saveComponent = async () => {
    const price = Number(formValues.price);
    const stock = Number(formValues.stock);

    if (
      !formValues.name.trim() ||
      !formValues.brand.trim() ||
      !formValues.categoryId ||
      !formValues.price.trim() ||
      !formValues.stock.trim() ||
      !formValues.description.trim() ||
      !formValues.imageUrl.trim() ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(stock) ||
      stock < 0
    ) {
      setModalError('Por favor, completa todos los campos del formulario (incluyendo la descripción y la imagen) con valores válidos.');
      return;
    }

    const missingAttr = categoryAttributesToFill.some(attr => {
      const val = productAttributesValues[attr.id];
      return !val || !val.trim();
    });

    if (missingAttr) {
      setModalError('Por favor, completa todas las especificaciones técnicas asociadas a la categoría.');
      return;
    }

    const payload: CatalogSavePayload = {
      name: formValues.name,
      description: formValues.description,
      categoryId: formValues.categoryId,
      brand: formValues.brand,
      price,
      stock: Math.trunc(stock),
      imageUrl: formValues.imageUrl || undefined,
    };

    try {
      setIsSaving(true);
      setModalError('');

      let savedId = '';
      let updatedComponent: CatalogComponent | null = null;

      if (modalMode === 'create') {
        const created = await createCatalogComponent(payload);
        savedId = created.id;
        updatedComponent = created;
      }

      if (modalMode === 'edit' && selectedComponent) {
        const updated = await updateCatalogComponent(selectedComponent.id, payload);
        savedId = selectedComponent.id;
        updatedComponent = updated;
      }

      if (savedId) {
        const attrPayload = Object.entries(productAttributesValues)
          .filter(([_, value]) => value !== undefined && value !== '')
          .map(([attributeId, value]) => ({ attributeId, value }));
        
        await setProductAttributes(savedId, attrPayload);
        
        if (updatedComponent) {
          const detailedAttrs = await getProductAttributes(savedId);
          updatedComponent.attributes = detailedAttrs.map(da => ({
            name: da.attribute.name,
            value: da.value,
            unit: da.attribute.unit,
          }));
        }
      }

      if (modalMode === 'create' && updatedComponent) {
        setComponents((currentComponents) => [updatedComponent!, ...currentComponents]);
      } else if (modalMode === 'edit' && updatedComponent) {
        setComponents((currentComponents) =>
          currentComponents.map((component) => (component.id === selectedComponent?.id ? updatedComponent! : component)),
        );
      }

      closeModal();
    } catch (error: any) {
      const backendMessage = error?.response?.data?.message;
      const formattedMessage = Array.isArray(backendMessage)
        ? backendMessage.join(', ')
        : backendMessage;
      setModalError(formattedMessage || 'No se pudo guardar el componente. Revisa permisos y datos ingresados.');
      setIsSaving(false);
    }
  };

  const removeComponent = async () => {
    if (!selectedComponent) return;

    try {
      setIsSaving(true);
      setModalError('');

      await deleteCatalogComponent(selectedComponent.id);
      setComponents((currentComponents) =>
        currentComponents.filter((component) => component.id !== selectedComponent.id),
      );
      closeModal();
    } catch {
      setModalError('No se pudo eliminar el componente. Revisa permisos y endpoint del backend.');
      setIsSaving(false);
    }
  };

  const openCreateAttrModal = () => {
    setAttrForm({ name: '', slug: '', dataType: 'TEXT', unit: '', optionsString: '' });
    setSelectedAttribute(null);
    setAttrModalError('');
    setAttrModalMode('create');
  };

  const openEditAttrModal = (attr: BackendAttribute) => {
    setSelectedAttribute(attr);
    setAttrForm({
      name: attr.name,
      slug: attr.slug,
      dataType: attr.dataType,
      unit: attr.unit ?? '',
      optionsString: attr.options ? attr.options.join(', ') : '',
    });
    setAttrModalError('');
    setAttrModalMode('edit');
  };

  const saveAttribute = async () => {
    if (!attrForm.name.trim()) {
      setAttrModalError('El nombre es obligatorio.');
      return;
    }
    const options = ['SELECT', 'MULTI_SELECT'].includes(attrForm.dataType)
      ? attrForm.optionsString.split(',').map(s => s.trim()).filter(Boolean)
      : null;

    const payload = {
      name: attrForm.name.trim(),
      dataType: attrForm.dataType,
      unit: attrForm.unit.trim() || null,
      options,
    };

    try {
      setIsSavingAttr(true);
      setAttrModalError('');

      if (attrModalMode === 'create') {
        const created = await createAttribute(payload);
        setGlobalAttributes(current => [created, ...current]);
      } else if (attrModalMode === 'edit' && selectedAttribute) {
        const updated = await updateAttribute(selectedAttribute.id, payload);
        setGlobalAttributes(current => current.map(a => a.id === selectedAttribute.id ? updated : a));
      }
      setAttrModalMode(null);
    } catch (err: any) {
      setAttrModalError(err.response?.data?.message || 'Error al guardar el atributo.');
    } finally {
      setIsSavingAttr(false);
    }
  };

  const removeAttribute = (attr: BackendAttribute) => {
    setAttrToDelete(attr);
  };

  const handleConfirmDeleteAttribute = async () => {
    if (!attrToDelete) return;
    try {
      await deleteAttribute(attrToDelete.id);
      setGlobalAttributes(current => current.filter(a => a.id !== attrToDelete.id));
      setCategoryAttrs(current => current.filter(a => a.id !== attrToDelete.id));
      setAttrToDelete(null);
    } catch (err: any) {
      alert('Error al eliminar atributo: ' + (err.response?.data?.message || err.message));
    }
  };

  const associateAttr = async (attributeId: string) => {
    if (!selectedCategoryIdForAttr) return;
    try {
      await associateAttributeToCategory(selectedCategoryIdForAttr, attributeId);
      const attrs = await getAttributesByCategory(selectedCategoryIdForAttr);
      setCategoryAttrs(attrs);
    } catch (err: any) {
      alert('Error al asociar atributo: ' + (err.response?.data?.message || err.message));
    }
  };

  const disassociateAttr = (attr: BackendAttribute) => {
    setAttrToDisassociate(attr);
  };

  const handleConfirmDisassociateAttribute = async () => {
    if (!attrToDisassociate || !selectedCategoryIdForAttr) return;
    try {
      await removeAttributeFromCategory(selectedCategoryIdForAttr, attrToDisassociate.id);
      setCategoryAttrs(current => current.filter(a => a.id !== attrToDisassociate.id));
      setAttrToDisassociate(null);
    } catch (err: any) {
      alert('Error al desasociar atributo: ' + (err.response?.data?.message || err.message));
    }
  };

  const openCreateCatModal = () => {
    setCatForm({ name: '', description: '', parentId: '' });
    setCatModalError('');
    setCatModalMode('create');
  };

  const saveCategoryAction = async () => {
    if (!catForm.name.trim()) {
      setCatModalError('El nombre es obligatorio.');
      return;
    }
    const payload = {
      name: catForm.name.trim(),
      description: catForm.description.trim() || undefined,
      parentId: catForm.parentId || null,
    };
    try {
      setIsSavingCat(true);
      setCatModalError('');
      const created = await createCategory(payload);
      setCategories(current => [created, ...current]);
      setCatModalMode(null);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Error al guardar la categoría.';
      setCatModalError(Array.isArray(errMsg) ? errMsg.join(', ') : errMsg);
    } finally {
      setIsSavingCat(false);
    }
  };

  const deleteCategoryAction = (cat: BackendCategory) => {
    setCatToDelete(cat);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!catToDelete) return;
    try {
      await deleteCategory(catToDelete.id);
      setCategories(current => current.filter(c => c.id !== catToDelete.id));
      setCatToDelete(null);
    } catch (err: any) {
      alert('Error al desactivar la categoría: ' + (err.response?.data?.message || err.message));
    }
  };

  const openCreateRuleModal = () => {
    setRuleForm({
      name: '',
      description: '',
      sourceAttributeId: '',
      targetAttributeId: '',
      ruleType: 'MUST_MATCH',
      operator: 'EQUALS',
    });
    setRuleModalError('');
    setRuleModalMode('create');
  };

  const saveCompatibilityRuleAction = async () => {
    if (
      !ruleForm.name.trim() ||
      !ruleForm.sourceAttributeId ||
      !ruleForm.targetAttributeId
    ) {
      setRuleModalError('Por favor completa los campos obligatorios.');
      return;
    }

    const payload = {
      name: ruleForm.name.trim(),
      description: ruleForm.description.trim() || undefined,
      sourceAttributeId: ruleForm.sourceAttributeId,
      targetAttributeId: ruleForm.targetAttributeId,
      ruleType: ruleForm.ruleType,
      condition: {
        operator: ruleForm.operator,
      },
    };

    try {
      setIsSavingRule(true);
      setRuleModalError('');
      const createdRule = await createCompatibilityRule(payload);
      setCompatibilityRulesList((current) => [createdRule, ...current]);
      setRuleModalMode(null);
    } catch (err: any) {
      const errMsg = err.response?.data?.message || 'Error al guardar la regla de compatibilidad.';
      setRuleModalError(Array.isArray(errMsg) ? errMsg.join(', ') : errMsg);
    } finally {
      setIsSavingRule(false);
    }
  };

  const deleteCompatibilityRuleAction = (rule: CompatibilityRule) => {
    setRuleToDelete(rule);
  };

  const handleConfirmDeleteRule = async () => {
    if (!ruleToDelete) return;
    try {
      await deleteCompatibilityRule(ruleToDelete.id);
      setCompatibilityRulesList((current) => current.filter((r) => r.id !== ruleToDelete.id));
      setRuleToDelete(null);
    } catch (err: any) {
      alert('Error al desactivar la regla: ' + (err.response?.data?.message || err.message));
    }
  };

  return {
    components,
    categories,
    search,
    categoryFilter,
    statusFilter,
    pageSize,
    currentPage,
    isLoading,
    isSaving,
    modalError,
    modalMode,
    selectedComponent,
    formValues,
    loadError,
    activeTab,
    catModalMode,
    isSavingCat,
    catModalError,
    catToDelete,
    catForm,
    compatibilityRulesList,
    ruleModalMode,
    isSavingRule,
    ruleModalError,
    ruleToDelete,
    ruleForm,
    globalAttributes,
    selectedCategoryIdForAttr,
    categoryAttrs,
    attrModalMode,
    selectedAttribute,
    attrForm,
    attrModalError,
    isSavingAttr,
    categoryAttributesToFill,
    productAttributesValues,
    attrToDelete,
    attrToDisassociate,
    setSearch,
    setCategoryFilter,
    setStatusFilter,
    setPageSize,
    setCurrentPage,
    setIsLoading,
    setIsSaving,
    setModalError,
    setModalMode,
    setSelectedComponent,
    setFormValues,
    setLoadError,
    setActiveTab,
    setCatModalMode,
    setIsSavingCat,
    setCatModalError,
    setCatToDelete,
    setCatForm,
    setCompatibilityRulesList,
    setRuleModalMode,
    setIsSavingRule,
    setRuleModalError,
    setRuleToDelete,
    setRuleForm,
    setGlobalAttributes,
    setSelectedCategoryIdForAttr,
    setCategoryAttrs,
    setAttrModalMode,
    setSelectedAttribute,
    setAttrForm,
    setAttrModalError,
    setIsSavingAttr,
    setCategoryAttributesToFill,
    setProductAttributesValues,
    setAttrToDelete,
    setAttrToDisassociate,
    leafCategories,
    categorySelectOptions,
    categoryFilterOptions,
    filteredComponents,
    totalPages,
    pageComponents,
    firstResult,
    lastResult,
    pagesToShow,
    resetFilters,
    closeModal,
    openCreateModal,
    openEditModal,
    handleCategoryChange,
    openViewModal,
    openDeleteModal,
    saveComponent,
    removeComponent,
    openCreateAttrModal,
    openEditAttrModal,
    saveAttribute,
    removeAttribute,
    handleConfirmDeleteAttribute,
    associateAttr,
    disassociateAttr,
    handleConfirmDisassociateAttribute,
    openCreateCatModal,
    saveCategoryAction,
    deleteCategoryAction,
    handleConfirmDeleteCategory,
    openCreateRuleModal,
    saveCompatibilityRuleAction,
    deleteCompatibilityRuleAction,
    handleConfirmDeleteRule,
  };
};
