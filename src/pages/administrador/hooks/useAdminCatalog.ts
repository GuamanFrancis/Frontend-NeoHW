import { useEffect, useMemo, useState } from 'react';
import {
  createCatalogComponent,
  deleteCatalogComponent,
  getCatalogComponents,
  updateCatalogComponent,
} from '../../../services/catalogService';
import { getCategories, getLeafCategories, createCategory, updateCategory, deleteCategory } from '../../../services/categoryService';
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
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastTitle, setToastTitle] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
        setToastTitle(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const [activeTab, setActiveTab] = useState<'componentes' | 'atributos' | 'categorias' | 'reglas'>('componentes');
  const [catModalMode, setCatModalMode] = useState<'create' | 'edit' | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<BackendCategory | null>(null);
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

  const [formErrors, setFormErrors] = useState<{
    name?: string;
    brand?: string;
    categoryId?: string;
    price?: string;
    stock?: string;
    description?: string;
    imageUrl?: string;
  }>({});

  const [attributeErrors, setAttributeErrors] = useState<Record<string, string>>({});

  const [attrErrors, setAttrErrors] = useState<{
    name?: string;
    unit?: string;
    optionsString?: string;
  }>({});

  const validateField = (field: keyof CatalogFormValues, value: string) => {
    let error = '';
    if (field === 'name') {
      if (!value.trim()) error = 'El nombre es obligatorio.';
    } else if (field === 'brand') {
      if (!value.trim()) error = 'La marca es obligatoria.';
    } else if (field === 'categoryId') {
      if (!value) error = 'Debes seleccionar una categoría.';
    } else if (field === 'price') {
      if (!value.trim()) {
        error = 'El precio es obligatorio.';
      } else {
        const num = Number(value);
        if (isNaN(num) || num < 0) {
          error = 'El precio debe ser un número válido mayor o igual a 0.';
        }
      }
    } else if (field === 'stock') {
      if (!value.trim()) {
        error = 'El stock es obligatorio.';
      } else {
        const num = Number(value);
        if (!Number.isInteger(num) || num < 0) {
          error = 'El stock debe ser un número entero mayor o igual a 0.';
        }
      }
    } else if (field === 'description') {
      if (!value.trim()) error = 'La descripción es obligatoria.';
    } else if (field === 'imageUrl') {
      if (!value.trim()) error = 'La URL de la imagen es obligatoria.';
    }

    setFormErrors(curr => ({ ...curr, [field]: error }));
  };

  const updateFormField = (field: keyof CatalogFormValues, value: string) => {
    setFormValues(curr => ({ ...curr, [field]: value }));
    validateField(field, value);
  };

  const validateAttributeValue = (attributeId: string, value: string) => {
    let error = '';
    const attr = categoryAttributesToFill.find(a => a.id === attributeId);
    if (attr) {
      if (!value.trim()) {
        error = 'Este campo es obligatorio.';
      } else if (attr.dataType === 'NUMBER') {
        const num = Number(value);
        if (isNaN(num)) {
          error = 'Debe ser un número válido.';
        }
      }
    }
    setAttributeErrors(curr => ({ ...curr, [attributeId]: error }));
  };

  const updateAttributeValue = (attributeId: string, value: string) => {
    setProductAttributesValues(curr => ({ ...curr, [attributeId]: value }));
    validateAttributeValue(attributeId, value);
  };

  const validateAttrField = (field: 'name' | 'unit' | 'optionsString', value: string, dataType?: string) => {
    let error = '';
    const currentDataType = dataType || attrForm.dataType;
    if (field === 'name') {
      if (!value.trim()) {
        error = 'El nombre es obligatorio.';
      } else if (value.length > 100) {
        error = 'El nombre no puede exceder los 100 caracteres.';
      }
    } else if (field === 'unit') {
      if (value.length > 20) {
        error = 'La unidad no puede exceder los 20 caracteres.';
      }
    } else if (field === 'optionsString') {
      if (['SELECT', 'MULTI_SELECT'].includes(currentDataType) && !value.trim()) {
        error = 'Debes especificar al menos una opción (separadas por comas).';
      }
    }
    setAttrErrors(curr => ({ ...curr, [field]: error }));
  };

  const updateAttrFormField = (field: 'name' | 'unit' | 'optionsString' | 'dataType', value: any) => {
    setAttrForm(curr => {
      const next = { ...curr, [field]: value };
      if (field === 'dataType') {
        validateAttrField('optionsString', next.optionsString, value);
      } else {
        validateAttrField(field, value);
      }
      return next;
    });
  };

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
    setFormErrors({});
    setAttributeErrors({});
    setIsSaving(false);
  };

  const openCreateModal = () => {
    setModalError('');
    setFormValues(emptyForm);
    setCategoryAttributesToFill([]);
    setProductAttributesValues({});
    setFormErrors({});
    setAttributeErrors({});
    setSelectedComponent(null);
    setModalMode('create');
  };

  const openEditModal = async (component: CatalogComponent) => {
    setModalError('');
    setSelectedComponent(component);
    setFormValues(mapComponentToForm(component));
    setFormErrors({});
    setAttributeErrors({});
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
    updateFormField('categoryId', categoryId);
    setProductAttributesValues({});
    setAttributeErrors({});
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

    const newFormErrors: typeof formErrors = {};
    let hasErrors = false;

    if (!formValues.name.trim()) {
      newFormErrors.name = 'El nombre es obligatorio.';
      hasErrors = true;
    }
    if (!formValues.brand.trim()) {
      newFormErrors.brand = 'La marca es obligatoria.';
      hasErrors = true;
    }
    if (!formValues.categoryId) {
      newFormErrors.categoryId = 'Debes seleccionar una categoría.';
      hasErrors = true;
    }
    if (!formValues.price.trim()) {
      newFormErrors.price = 'El precio es obligatorio.';
      hasErrors = true;
    } else if (isNaN(price) || price < 0) {
      newFormErrors.price = 'El precio debe ser un número válido mayor o igual a 0.';
      hasErrors = true;
    }
    if (!formValues.stock.trim()) {
      newFormErrors.stock = 'El stock es obligatorio.';
      hasErrors = true;
    } else if (!Number.isInteger(stock) || stock < 0) {
      newFormErrors.stock = 'El stock debe ser un número entero mayor o igual a 0.';
      hasErrors = true;
    }
    if (!formValues.description.trim()) {
      newFormErrors.description = 'La descripción es obligatoria.';
      hasErrors = true;
    }
    if (!formValues.imageUrl.trim()) {
      newFormErrors.imageUrl = 'La URL de la imagen es obligatoria.';
      hasErrors = true;
    }

    setFormErrors(newFormErrors);

    const newAttrErrors: Record<string, string> = {};
    categoryAttributesToFill.forEach(attr => {
      const val = productAttributesValues[attr.id] ?? '';
      if (!val.trim()) {
        newAttrErrors[attr.id] = 'Este campo es obligatorio.';
        hasErrors = true;
      } else if (attr.dataType === 'NUMBER') {
        const num = Number(val);
        if (isNaN(num)) {
          newAttrErrors[attr.id] = 'Debe ser un número válido.';
          hasErrors = true;
        }
      }
    });

    setAttributeErrors(newAttrErrors);

    if (hasErrors) {
      setModalError('Por favor, completa todos los campos obligatorios con valores válidos.');
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
        setToastTitle('¡COMPONENTE CREADO!');
        setToastMessage(`El componente "${updatedComponent.name}" ha sido registrado en el catálogo.`);
      } else if (modalMode === 'edit' && updatedComponent) {
        setComponents((currentComponents) =>
          currentComponents.map((component) => (component.id === selectedComponent?.id ? updatedComponent! : component)),
        );
        setToastTitle('¡COMPONENTE ACTUALIZADO!');
        setToastMessage(`Los datos del componente "${updatedComponent.name}" han sido actualizados.`);
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
      setToastTitle('¡COMPONENTE ELIMINADO!');
      setToastMessage(`El componente "${selectedComponent.name}" ha sido eliminado del catálogo.`);
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
    setAttrErrors({});
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
    setAttrErrors({});
    setAttrModalMode('edit');
  };

  const saveAttribute = async () => {
    const hasNameError = !attrForm.name.trim();
    const hasOptionsError = ['SELECT', 'MULTI_SELECT'].includes(attrForm.dataType) && !attrForm.optionsString.trim();
    const hasUnitError = attrForm.unit.length > 20;

    const newErrors = {
      name: hasNameError ? 'El nombre es obligatorio.' : attrForm.name.length > 100 ? 'El nombre no puede exceder los 100 caracteres.' : undefined,
      unit: hasUnitError ? 'La unidad no puede exceder los 20 caracteres.' : undefined,
      optionsString: hasOptionsError ? 'Debes especificar al menos una opción (separadas por comas).' : undefined,
    };

    setAttrErrors(newErrors);

    if (newErrors.name || newErrors.unit || newErrors.optionsString) {
      setAttrModalError('Por favor, completa todos los campos obligatorios con valores válidos.');
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
        setToastTitle('¡ATRIBUTO CREADO!');
        setToastMessage(`El atributo técnico "${created.name}" ha sido registrado con éxito.`);
      } else if (attrModalMode === 'edit' && selectedAttribute) {
        const updated = await updateAttribute(selectedAttribute.id, payload);
        setGlobalAttributes(current => current.map(a => a.id === selectedAttribute.id ? updated : a));
        setToastTitle('¡ATRIBUTO ACTUALIZADO!');
        setToastMessage(`El atributo técnico "${updated.name}" ha sido actualizado.`);
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
      setToastTitle('¡ATRIBUTO ELIMINADO!');
      setToastMessage(`El atributo técnico "${attrToDelete.name}" ha sido eliminado de forma permanente.`);
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
      const attrObj = globalAttributes.find(a => a.id === attributeId);
      setToastTitle('¡ATRIBUTO VINCULADO!');
      setToastMessage(`El atributo "${attrObj?.name || ''}" ha sido asociado a la categoría.`);
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
      setToastTitle('¡ATRIBUTO DESASOCIADO!');
      setToastMessage(`El atributo "${attrToDisassociate.name}" fue desvinculado de la categoría.`);
      setAttrToDisassociate(null);
    } catch (err: any) {
      alert('Error al desasociar atributo: ' + (err.response?.data?.message || err.message));
    }
  };

  const openCreateCatModal = () => {
    setCatForm({ name: '', description: '', parentId: '' });
    setSelectedCategory(null);
    setCatModalError('');
    setCatModalMode('create');
  };

  const openEditCatModal = (cat: BackendCategory) => {
    setSelectedCategory(cat);
    setCatForm({
      name: cat.name,
      description: cat.description || '',
      parentId: cat.parentId || '',
    });
    setCatModalError('');
    setCatModalMode('edit');
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
      if (catModalMode === 'create') {
        const created = await createCategory(payload);
        setCategories(current => [created, ...current]);
        setToastTitle('¡CATEGORÍA CREADA!');
        setToastMessage(`La categoría "${created.name}" ha sido registrada con éxito.`);
      } else if (catModalMode === 'edit' && selectedCategory) {
        const updated = await updateCategory(selectedCategory.id, payload);
        setCategories(current => current.map(c => c.id === selectedCategory.id ? updated : c));
        setToastTitle('¡CATEGORÍA ACTUALIZADA!');
        setToastMessage(`La categoría "${updated.name}" ha sido actualizada con éxito.`);
      }
      setCatModalMode(null);
      setSelectedCategory(null);
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
      setToastTitle('¡CATEGORÍA DESACTIVADA!');
      setToastMessage(`La categoría "${catToDelete.name}" ha sido desactivada temporalmente.`);
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
      setToastTitle('¡REGLA CREADA!');
      setToastMessage(`La regla "${createdRule.name}" ha sido guardada con éxito.`);
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
      setToastTitle('¡REGLA DESACTIVADA!');
      setToastMessage(`La regla "${ruleToDelete.name}" ha sido eliminada del motor de compatibilidad.`);
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
    formErrors,
    updateFormField,
    attributeErrors,
    updateAttributeValue,
    attrErrors,
    updateAttrFormField,
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
    openEditCatModal,
    saveCategoryAction,
    deleteCategoryAction,
    handleConfirmDeleteCategory,
    openCreateRuleModal,
    saveCompatibilityRuleAction,
    deleteCompatibilityRuleAction,
    handleConfirmDeleteRule,
    toastMessage,
    setToastMessage,
    toastTitle,
  };
};
