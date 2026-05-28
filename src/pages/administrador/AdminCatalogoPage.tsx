import { useEffect, useMemo, useState } from 'react';
import { Eye, PackageSearch, Pencil, Plus, Search, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { FormInput } from '../../components/ui/FormInput';
import { FormSelect } from '../../components/ui/FormSelect';
import { Modal } from '../../components/ui/Modal';
import { PageCard } from '../../components/ui/PageCard';
import {
  createCatalogComponent,
  deleteCatalogComponent,
  getCatalogComponents,
  updateCatalogComponent,
} from '../../services/catalogService';
import { getCategories, getLeafCategories, createCategory, deleteCategory } from '../../services/categoryService';
import type { BackendCategory, CatalogComponent, CatalogSavePayload, CatalogStockStatus } from '../../types/catalog';
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
} from '../../services/attributesService';
import {
  getCompatibilityRules,
  createCompatibilityRule,
  deleteCompatibilityRule,
  type CompatibilityRule,
} from '../../services/compatibilityService';

type ModalMode = 'create' | 'edit' | 'view' | 'delete' | null;

type CatalogFormValues = {
  name: string;
  description: string;
  categoryId: string;
  brand: string;
  price: string;
  stock: string;
  imageUrl: string;
};

const emptyForm: CatalogFormValues = {
  name: '',
  description: '',
  categoryId: '',
  brand: '',
  price: '',
  stock: '',
  imageUrl: '',
};

const statusMeta: Record<CatalogStockStatus, { label: string; className: string }> = {
  disponible: {
    label: 'Disponible',
    className:
      'border-emerald-400/40 bg-emerald-400/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300',
  },
  'stock-bajo': {
    label: 'Stock bajo',
    className:
      'border-amber-400/40 bg-amber-400/10 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300',
  },
  agotado: {
    label: 'Agotado',
    className: 'border-red-400/40 bg-red-400/10 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300',
  },
};

const fieldClass =
  'h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-200 dark:placeholder:text-neutral-500 dark:focus:border-teal-400 dark:disabled:bg-neutral-900';

const actionButtonClass =
  'flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-teal-500/60 hover:bg-teal-50 hover:text-teal-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:border-teal-400/60 dark:hover:bg-teal-400/10 dark:hover:text-teal-200';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);

const getVisiblePages = (totalPages: number, currentPage: number) => {
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

const mapComponentToForm = (component: CatalogComponent): CatalogFormValues => ({
  name: component.name,
  description: component.description,
  categoryId: component.categoryId,
  brand: component.brand,
  price: component.price.toString(),
  stock: component.stock.toString(),
  imageUrl: component.imageUrl ?? '',
});

export const AdminCatalogoPage = () => {
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
          console.error('Error loading global attributes:', err);
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
          console.error('Error loading compatibility rules:', err);
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
          console.error('Error loading categories:', err);
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
        console.error('Error loading category attributes:', err);
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
      console.error('Error fetching attributes on edit:', e);
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
      console.error('Error loading category attributes:', e);
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
      console.error('Error fetching detailed attributes on view:', e);
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

  return (
    <PageCard
      title="Gestionar catalogo de componentes"
      text="Administra productos, inventario, disponibilidad y atributos técnicos en una sola vista."
      icon={<PackageSearch className="h-6 w-6" />}
      actions={
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 dark:border-neutral-800 dark:bg-neutral-900">
            <button
              type="button"
              onClick={() => setActiveTab('componentes')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${activeTab === 'componentes' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-600 dark:text-neutral-300'}`}
            >
              Componentes
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('atributos')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${activeTab === 'atributos' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-600 dark:text-neutral-300'}`}
            >
              Atributos Técnicos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('categorias')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${activeTab === 'categorias' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-600 dark:text-neutral-300'}`}
            >
              Categorías
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reglas')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${activeTab === 'reglas' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-600 dark:text-neutral-300'}`}
            >
              Reglas Lógicas
            </button>
          </div>
          {activeTab === 'componentes' && (
            <Button type="button" className="h-10 px-4 text-sm" onClick={openCreateModal}>
              <Plus className="h-4 w-4" />
              Nuevo componente
            </Button>
          )}
          {activeTab === 'categorias' && (
            <Button type="button" className="h-10 px-4 text-sm" onClick={openCreateCatModal}>
              <Plus className="h-4 w-4" />
              Nueva Categoría
            </Button>
          )}
          {activeTab === 'reglas' && (
            <Button type="button" className="h-10 px-4 text-sm" onClick={openCreateRuleModal}>
              <Plus className="h-4 w-4" />
              Nueva Regla
            </Button>
          )}
        </div>
      }
    >
      {loadError && (
        <div className="mb-4 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-200">
          {loadError}
        </div>
      )}

      {activeTab === 'componentes' && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="grid gap-3 lg:grid-cols-[1fr_220px_180px_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Buscar componente, marca o modelo..."
                className={`${fieldClass} w-full pl-10`}
              />
            </label>

            <select
              className={fieldClass}
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              {categoryFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              className={fieldClass}
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as 'todos' | CatalogStockStatus);
                setCurrentPage(1);
              }}
            >
              <option value="todos">Todos los estados</option>
              <option value="disponible">Disponible</option>
              <option value="stock-bajo">Stock bajo</option>
              <option value="agotado">Agotado</option>
            </select>

            <Button type="button" variant="outline" className="h-10 px-4 text-sm" onClick={resetFilters}>
              Limpiar
            </Button>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/[0.03] dark:text-neutral-400">
                  <tr>
                    <th className="px-4 py-3 font-bold">Producto</th>
                    <th className="px-4 py-3 font-bold">Categoria</th>
                    <th className="px-4 py-3 font-bold">Marca</th>
                    <th className="px-4 py-3 font-bold">Precio</th>
                    <th className="px-4 py-3 font-bold">Stock</th>
                    <th className="px-4 py-3 font-bold">Estado</th>
                    <th className="px-4 py-3 text-right font-bold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                  {pageComponents.map((component) => (
                    <tr key={component.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-100 dark:border-neutral-700 dark:bg-neutral-900">
                            {component.imageUrl ? (
                              <img src={component.imageUrl} alt={component.name} className="h-full w-full object-cover" />
                            ) : (
                              <PackageSearch className="h-4 w-4 text-slate-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-950 dark:text-white">{component.name}</p>
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">{component.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-neutral-300">{component.category}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-neutral-300">{component.brand}</td>
                      <td className="px-4 py-3 font-semibold text-teal-700 dark:text-teal-300">{formatPrice(component.price)}</td>
                      <td className={`px-4 py-3 font-semibold ${component.stock === 0 ? 'text-red-600 dark:text-red-300' : 'text-amber-600 dark:text-amber-300'}`}>
                        {component.stock}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusMeta[component.status].className}`}>
                          {statusMeta[component.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className={actionButtonClass}
                            onClick={() => void openEditModal(component)}
                            aria-label="Editar componente"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className={actionButtonClass}
                            onClick={() => openViewModal(component)}
                            aria-label="Ver componente"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-300 text-red-600 transition hover:border-red-500 hover:bg-red-50 hover:text-red-700 dark:border-red-500/35 dark:text-red-300 dark:hover:border-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-200"
                            onClick={() => openDeleteModal(component)}
                            aria-label="Eliminar componente"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {isLoading && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-neutral-400">
                        Cargando catalogo...
                      </td>
                    </tr>
                  )}

                  {!isLoading && pageComponents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500 dark:text-neutral-400">
                        No hay componentes para los filtros actuales.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-500 dark:border-neutral-800 dark:text-neutral-400 md:flex-row md:items-center md:justify-between">
              <p>
                Mostrando {firstResult} a {lastResult} de {filteredComponents.length} componentes
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={actionButtonClass}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  aria-label="Pagina anterior"
                >
                  {'<'}
                </button>

                {pagesToShow.map((page, index) =>
                  page === 'ellipsis' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-slate-500">
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={
                        page === currentPage
                          ? 'h-8 min-w-8 rounded-lg bg-teal-500 px-2 text-xs font-bold text-white'
                          : actionButtonClass
                      }
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  className={actionButtonClass}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Pagina siguiente"
                >
                  {'>'}
                </button>

                <select
                  className={`${fieldClass} h-8`}
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10 por pagina</option>
                  <option value={20}>20 por pagina</option>
                  <option value={30}>30 por pagina</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'atributos' && (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white">Atributos Globales</h3>
              <Button type="button" className="h-8 px-3 text-xs" onClick={openCreateAttrModal}>
                <Plus className="h-3 w-3 mr-1" /> Nuevo Atributo
              </Button>
            </div>
            
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-neutral-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-slate-500 dark:bg-white/[0.02] dark:text-neutral-400">
                  <tr>
                    <th className="px-3 py-2 font-bold">Atributo</th>
                    <th className="px-3 py-2 font-bold">Slug</th>
                    <th className="px-3 py-2 font-bold">Tipo de Dato</th>
                    <th className="px-3 py-2 font-bold">Unidad</th>
                    <th className="px-3 py-2 text-right font-bold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                  {globalAttributes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                        No hay atributos globales registrados.
                      </td>
                    </tr>
                  ) : (
                    globalAttributes.map((attr) => (
                      <tr key={attr.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                        <td className="px-3 py-2 font-semibold text-slate-950 dark:text-white">{attr.name}</td>
                        <td className="px-3 py-2 text-slate-650 dark:text-neutral-450">{attr.slug}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-neutral-850 dark:text-neutral-300">
                            {attr.dataType}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-600 dark:text-neutral-400">{attr.unit ?? '-'}</td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditAttrModal(attr)}
                              className="flex h-6 w-6 items-center justify-center rounded text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                              title="Editar"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeAttribute(attr)}
                              className="flex h-6 w-6 items-center justify-center rounded text-red-500 hover:bg-red-500/10"
                              title="Eliminar"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white mb-4">Paso 1: Selecciona una Categoría</h3>
              <FormSelect
                label="Categoría"
                value={selectedCategoryIdForAttr}
                onChange={(e) => setSelectedCategoryIdForAttr(e.target.value)}
                options={categorySelectOptions}
              />
            </div>

            {selectedCategoryIdForAttr && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-950">
                <div className="mb-4">
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Paso 2: Especificaciones de Categoría</h3>
                  <p className="text-xs text-slate-500 mt-1">Vincula o remueve atributos de esta categoría de hardware.</p>
                </div>

                <div className="border-t border-slate-100 dark:border-neutral-900 pt-3 mb-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Atributos Vinculados</h4>
                  <div className="grid gap-2">
                    {categoryAttrs.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-2">Ningún atributo vinculado a esta categoría.</p>
                    ) : (
                      categoryAttrs.map(attr => (
                        <div key={attr.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-1.5 dark:border-neutral-800">
                          <span className="text-xs font-bold text-slate-950 dark:text-white">{attr.name} <span className="text-[10px] text-slate-450">({attr.dataType})</span></span>
                          <button
                            type="button"
                            onClick={() => disassociateAttr(attr)}
                            className="flex h-6 w-6 items-center justify-center rounded text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-neutral-900 pt-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Asociar Nuevo Atributo</h4>
                  <div className="grid gap-2">
                    {globalAttributes
                      .filter(attr => !categoryAttrs.some(ca => ca.id === attr.id))
                      .map(attr => (
                        <button
                          key={attr.id}
                          type="button"
                          onClick={() => void associateAttr(attr.id)}
                          className="flex items-center justify-between rounded-lg border border-dashed border-slate-350 px-3 py-1.5 text-left text-xs hover:border-teal-500 hover:bg-teal-50/10 dark:border-neutral-700 dark:hover:border-teal-400 transition"
                        >
                          <span className="font-semibold text-slate-700 dark:text-neutral-300">{attr.name}</span>
                          <Plus className="h-3 w-3 text-slate-400" />
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'categorias' && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white leading-none">Categorías de Hardware</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Gestiona la clasificación del hardware en la tienda (Procesadores, Memorias RAM, etc.).</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 mt-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/[0.03] dark:text-neutral-400">
                  <tr>
                    <th className="px-4 py-3 font-bold">Categoría</th>
                    <th className="px-4 py-3 font-bold">Slug</th>
                    <th className="px-4 py-3 font-bold">Descripción</th>
                    <th className="px-4 py-3 font-bold">Categoría Padre</th>
                    <th className="px-4 py-3 text-right font-bold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 dark:text-neutral-400">
                        No hay categorías registradas en la base de datos.
                      </td>
                    </tr>
                  ) : (
                    categories.map((cat) => (
                      <tr key={cat.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                        <td className="px-4 py-3 font-semibold text-slate-950 dark:text-white">
                          {cat.name}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-neutral-400">
                          {cat.slug}
                        </td>
                        <td className="px-4 py-3 text-slate-650 dark:text-neutral-350">
                          {cat.description || 'Sin descripción'}
                        </td>
                        <td className="px-4 py-3 text-slate-650 dark:text-neutral-450 font-medium">
                          {cat.parentId ? categories.find(c => c.id === cat.parentId)?.name || 'Categoría superior' : 'Ninguna'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-300 text-red-600 transition hover:border-red-500 hover:bg-red-50 hover:text-red-700 dark:border-red-500/35 dark:text-red-300 dark:hover:border-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-200"
                              onClick={() => deleteCategoryAction(cat)}
                              aria-label="Desactivar categoría"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reglas' && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white leading-none">Reglas de Compatibilidad</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Gestiona las reglas de hardware que usa el Simulador 3D para evitar ensambles incompatibles.</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 mt-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-white/[0.03] dark:text-neutral-400">
                  <tr>
                    <th className="px-4 py-3 font-bold">Regla</th>
                    <th className="px-4 py-3 font-bold">Tipo</th>
                    <th className="px-4 py-3 font-bold">Atributo Origen</th>
                    <th className="px-4 py-3 font-bold">Atributo Destino</th>
                    <th className="px-4 py-3 font-bold">Operador</th>
                    <th className="px-4 py-3 text-right font-bold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
                  {compatibilityRulesList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-neutral-400">
                        No hay reglas de compatibilidad registradas en la base de datos.
                      </td>
                    </tr>
                  ) : (
                    compatibilityRulesList.map((rule) => (
                      <tr key={rule.id} className="transition hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-950 dark:text-white">{rule.name}</p>
                          {rule.description && (
                            <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-400">{rule.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-400/10 dark:text-blue-300">
                            {rule.ruleType}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-650 dark:text-neutral-350">
                          {rule.sourceAttributeName || 'Atributo origen'}
                        </td>
                        <td className="px-4 py-3 text-slate-650 dark:text-neutral-350">
                          {rule.targetAttributeName || 'Atributo destino'}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-600 dark:text-neutral-400">
                          {rule.comparisonOperator || 'Igualdad'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-300 text-red-600 transition hover:border-red-500 hover:bg-red-50 hover:text-red-700 dark:border-red-500/35 dark:text-red-300 dark:hover:border-red-400 dark:hover:bg-red-500/10 dark:hover:text-red-200"
                              onClick={() => deleteCompatibilityRuleAction(rule)}
                              aria-label="Desactivar regla"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {}
      <Modal
        open={modalMode === 'create' || modalMode === 'edit'}
        title={modalMode === 'create' ? 'Nuevo componente' : 'Editar componente'}
        text="Completa la informacion principal del producto para gestionarlo en el catalogo."
        onClose={closeModal}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void saveComponent()} disabled={isSaving}>
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        <style>{`
          .scrollbar-none::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-none {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        <div className="max-h-[60vh] overflow-y-auto pr-2 scrollbar-none">
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput
              label="Nombre del producto"
              value={formValues.name}
              onChange={(event) => setFormValues((current) => ({ ...current, name: event.target.value }))}
              placeholder="AMD Ryzen 7 9700X"
            />
            <FormInput
              label="Marca"
              value={formValues.brand}
              onChange={(event) => setFormValues((current) => ({ ...current, brand: event.target.value }))}
              placeholder="AMD"
            />
            <FormSelect
              label="Categoria"
              value={formValues.categoryId}
              onChange={(event) => void handleCategoryChange(event.target.value)}
              options={categorySelectOptions}
            />
            <FormInput
              label="Precio (USD)"
              value={formValues.price}
              onChange={(event) => setFormValues((current) => ({ ...current, price: event.target.value }))}
              placeholder="425.99"
              inputMode="decimal"
            />
            <FormInput
              label="Stock"
              value={formValues.stock}
              onChange={(event) => setFormValues((current) => ({ ...current, stock: event.target.value }))}
              placeholder="18"
              inputMode="numeric"
              disabled={modalMode === 'edit'}
              title={modalMode === 'edit' ? "El stock solo puede ser modificado por el Vendedor desde la pestaña de Inventario." : undefined}
            />
            <FormInput
              label="Descripcion"
              value={formValues.description}
              onChange={(event) => setFormValues((current) => ({ ...current, description: event.target.value }))}
              placeholder="12 nucleos / 24 hilos"
            />
            <FormInput
              label="URL de imagen"
              value={formValues.imageUrl}
              onChange={(event) => setFormValues((current) => ({ ...current, imageUrl: event.target.value }))}
              placeholder="https://..."
            />
            
            {categoryAttributesToFill.length > 0 && (
              <div className="md:col-span-2 border-t border-slate-100 dark:border-neutral-800 pt-4 mt-2">
                <h4 className="text-xs font-bold text-teal-500 dark:text-teal-400 uppercase mb-3">Especificaciones Técnicas</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {categoryAttributesToFill.map(attr => {
                    const val = productAttributesValues[attr.id] ?? '';
                    const onChangeVal = (v: string) => {
                      setProductAttributesValues(curr => ({ ...curr, [attr.id]: v }));
                    };
                    
                    if (attr.dataType === 'SELECT' || attr.dataType === 'MULTI_SELECT') {
                      const options = [
                        { label: `Selecciona ${attr.name}`, value: '' },
                        ...(attr.options || []).map(opt => ({ label: opt, value: opt }))
                      ];
                      return (
                        <FormSelect
                          key={attr.id}
                          label={`${attr.name}${attr.unit ? ` (${attr.unit})` : ''}`}
                          value={val}
                          onChange={(e) => onChangeVal(e.target.value)}
                          options={options}
                        />
                      );
                    }
                    
                    if (attr.dataType === 'BOOLEAN') {
                      return (
                        <FormSelect
                          key={attr.id}
                          label={`${attr.name}`}
                          value={val}
                          onChange={(e) => onChangeVal(e.target.value)}
                          options={[
                            { label: 'Seleccionar', value: '' },
                            { label: 'Sí', value: 'true' },
                            { label: 'No', value: 'false' },
                          ]}
                        />
                      );
                    }
                    
                    return (
                      <FormInput
                        key={attr.id}
                        label={`${attr.name}${attr.unit ? ` (${attr.unit})` : ''}`}
                        value={val}
                        onChange={(e) => onChangeVal(e.target.value)}
                        placeholder={`Ingresa ${attr.name.toLowerCase()}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {modalError && (
          <div className="mt-4 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-200">
            {modalError}
          </div>
        )}
      </Modal>

      {}
      <Modal
        open={modalMode === 'view' && Boolean(selectedComponent)}
        title="Detalle del componente"
        text="Informacion actual del producto en el catalogo."
        onClose={closeModal}
        footer={
          <Button type="button" variant="ghost" onClick={closeModal}>
            Cerrar
          </Button>
        }
      >
        {selectedComponent && (
          <div className="space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <p><span className="font-semibold">Producto:</span> {selectedComponent.name}</p>
              <p><span className="font-semibold">Marca:</span> {selectedComponent.brand}</p>
              <p><span className="font-semibold">Categoria:</span> {selectedComponent.category}</p>
              <p><span className="font-semibold">Precio:</span> {formatPrice(selectedComponent.price)}</p>
              <p><span className="font-semibold">Stock:</span> {selectedComponent.stock}</p>
              <p><span className="font-semibold">Estado:</span> {statusMeta[selectedComponent.status].label}</p>
            </div>
            <p><span className="font-semibold">Descripcion:</span> {selectedComponent.description}</p>
            {selectedComponent.attributes && selectedComponent.attributes.length > 0 && (
              <div className="border-t border-slate-100 dark:border-neutral-800 pt-3">
                <p className="font-semibold mb-1">Especificaciones Técnicas:</p>
                <div className="grid gap-2 grid-cols-2 text-xs bg-slate-50 dark:bg-neutral-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-neutral-800">
                  {selectedComponent.attributes.map((attr, idx) => (
                    <div key={idx} className="flex justify-between border-b border-slate-200/50 dark:border-neutral-800/50 pb-1">
                      <span className="text-slate-500">{attr.name}</span>
                      <span className="font-bold text-slate-800 dark:text-neutral-250">{attr.value} {attr.unit || ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedComponent.imageUrl && (
              <img
                src={selectedComponent.imageUrl}
                alt={selectedComponent.name}
                className="h-44 w-full rounded-lg border border-slate-200 object-cover dark:border-neutral-700"
              />
            )}
          </div>
        )}
      </Modal>

      {}
      <Modal
        open={modalMode === 'delete' && Boolean(selectedComponent)}
        title="Eliminar componente"
        text="Esta accion eliminara el componente del catalogo."
        onClose={closeModal}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void removeComponent()} disabled={isSaving}>
              {isSaving ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 dark:text-neutral-300">
          ¿Seguro que deseas eliminar <span className="font-semibold">{selectedComponent?.name}</span>?
        </p>

        {modalError && (
          <div className="mt-4 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-200">
            {modalError}
          </div>
        )}
      </Modal>

      
      <Modal
        open={attrModalMode !== null}
        title={attrModalMode === 'create' ? 'Nuevo Atributo Técnico' : 'Editar Atributo Técnico'}
        text="Define las propiedades del atributo técnico global."
        onClose={() => setAttrModalMode(null)}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setAttrModalMode(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void saveAttribute()} disabled={isSavingAttr}>
              {isSavingAttr ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormInput
            label="Nombre del atributo"
            value={attrForm.name}
            onChange={(e) => setAttrForm(curr => ({ ...curr, name: e.target.value }))}
            placeholder="Socket, Frecuencia, Capacidad"
          />
          <FormSelect
            label="Tipo de Dato"
            value={attrForm.dataType}
            onChange={(e) => setAttrForm(curr => ({ ...curr, dataType: e.target.value as AttributeDataType }))}
            options={[
              { label: 'Texto', value: 'TEXT' },
              { label: 'Número', value: 'NUMBER' },
              { label: 'Booleano (Sí/No)', value: 'BOOLEAN' },
              { label: 'Desplegable (Select)', value: 'SELECT' },
              { label: 'Desplegable Múltiple', value: 'MULTI_SELECT' },
            ]}
          />
          <FormInput
            label="Unidad (opcional)"
            value={attrForm.unit}
            onChange={(e) => setAttrForm(curr => ({ ...curr, unit: e.target.value }))}
            placeholder="GB, MHz, W, etc."
            optional
          />
          {['SELECT', 'MULTI_SELECT'].includes(attrForm.dataType) && (
            <div className="md:col-span-2">
              <FormInput
                label="Opciones (separadas por comas)"
                value={attrForm.optionsString}
                onChange={(e) => setAttrForm(curr => ({ ...curr, optionsString: e.target.value }))}
                placeholder="AM4, AM5, LGA1700"
              />
            </div>
          )}
        </div>
        {attrModalError && (
          <div className="mt-4 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-200">
            {attrModalError}
          </div>
        )}
      </Modal>

      
      <Modal
        open={!!attrToDelete}
        title="¿Eliminar Atributo Global?"
        onClose={() => setAttrToDelete(null)}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                ¿Estás seguro de que deseas eliminar este atributo global?
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Esta acción no se puede deshacer y desvinculará este atributo de todas las categorías y componentes que lo utilicen. El atributo "{attrToDelete?.name}" se borrará permanentemente.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-neutral-900">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAttrToDelete(null)}
            >
              Cancelar
            </Button>
            <button
              type="button"
              onClick={() => void handleConfirmDeleteAttribute()}
              className="rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 transition text-xs shadow-sm"
            >
              Sí, eliminar
            </button>
          </div>
        </div>
      </Modal>

      
      <Modal
        open={!!attrToDisassociate}
        title="¿Desasociar Atributo?"
        onClose={() => setAttrToDisassociate(null)}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                ¿Estás seguro de que deseas desasociar este atributo?
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                El atributo "{attrToDisassociate?.name}" dejará de estar disponible para rellenar en los componentes de esta categoría. Los valores existentes en los productos no se verán afectados.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-neutral-900">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAttrToDisassociate(null)}
            >
              Cancelar
            </Button>
            <button
              type="button"
              onClick={() => void handleConfirmDisassociateAttribute()}
              className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold px-4 py-2 transition text-xs shadow-sm"
            >
              Sí, desasociar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={catModalMode === 'create'}
        title="Nueva Categoría de Hardware"
        text="Define las propiedades de la nueva categoría para clasificar el hardware de la tienda."
        onClose={() => setCatModalMode(null)}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setCatModalMode(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void saveCategoryAction()} disabled={isSavingCat}>
              {isSavingCat ? 'Guardando...' : 'Guardar'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <FormInput
              label="Nombre de la categoría"
              value={catForm.name}
              onChange={(e) => setCatForm(curr => ({ ...curr, name: e.target.value }))}
              placeholder="Ej: Tarjetas de Video, Procesadores"
            />
          </div>
          <div className="md:col-span-2">
            <FormInput
              label="Descripción (opcional)"
              value={catForm.description}
              onChange={(e) => setCatForm(curr => ({ ...curr, description: e.target.value }))}
              placeholder="Ej: Unidades de procesamiento gráfico de alto rendimiento."
            />
          </div>
          <div className="md:col-span-2">
            <FormSelect
              label="Categoría Padre (opcional para subcategorías)"
              value={catForm.parentId}
              onChange={(e) => setCatForm(curr => ({ ...curr, parentId: e.target.value }))}
              options={[
                { label: 'Ninguna (Categoría principal)', value: '' },
                ...categories.map(cat => ({ label: cat.name, value: cat.id }))
              ]}
            />
          </div>
        </div>
        {catModalError && (
          <div className="mt-4 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-200">
            {catModalError}
          </div>
        )}
      </Modal>

      <Modal
        open={!!catToDelete}
        title="¿Desactivar Categoría?"
        onClose={() => setCatToDelete(null)}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                ¿Estás seguro de que deseas desactivar esta categoría?
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Esta acción ocultará la categoría del catálogo. Los productos asociados seguirán existiendo pero no se listarán bajo esta categoría. La categoría "{catToDelete?.name}" se desactivará temporalmente.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-neutral-900">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCatToDelete(null)}
            >
              Cancelar
            </Button>
            <button
              type="button"
              onClick={() => void handleConfirmDeleteCategory()}
              className="rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 transition text-xs shadow-sm"
            >
              Sí, desactivar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={ruleModalMode === 'create'}
        title="Nueva Regla de Compatibilidad"
        text="Crea una regla lógica de compatibilidad de hardware para el simulador."
        onClose={() => setRuleModalMode(null)}
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setRuleModalMode(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void saveCompatibilityRuleAction()} disabled={isSavingRule}>
              {isSavingRule ? 'Creando...' : 'Crear Regla'}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <FormInput
              label="Nombre de la regla"
              value={ruleForm.name}
              onChange={(e) => setRuleForm(curr => ({ ...curr, name: e.target.value }))}
              placeholder="Ej: Compatibilidad de Socket AM5"
            />
          </div>
          <div className="md:col-span-2">
            <FormInput
              label="Descripción (opcional)"
              value={ruleForm.description}
              onChange={(e) => setRuleForm(curr => ({ ...curr, description: e.target.value }))}
              placeholder="Ej: Asegura que el procesador y la placa madre tengan el mismo tipo de socket."
            />
          </div>
          <FormSelect
            label="Atributo Origen (Ej: Placa Madre Socket)"
            value={ruleForm.sourceAttributeId}
            onChange={(e) => setRuleForm(curr => ({ ...curr, sourceAttributeId: e.target.value }))}
            options={[
              { label: 'Seleccionar atributo', value: '' },
              ...globalAttributes.map(attr => ({ label: attr.name, value: attr.id }))
            ]}
          />
          <FormSelect
            label="Atributo Destino (Ej: CPU Socket)"
            value={ruleForm.targetAttributeId}
            onChange={(e) => setRuleForm(curr => ({ ...curr, targetAttributeId: e.target.value }))}
            options={[
              { label: 'Seleccionar atributo', value: '' },
              ...globalAttributes.map(attr => ({ label: attr.name, value: attr.id }))
            ]}
          />
          <FormSelect
            label="Tipo de Regla"
            value={ruleForm.ruleType}
            onChange={(e) => setRuleForm(curr => ({ ...curr, ruleType: e.target.value as any }))}
            options={[
              { label: 'Coincidir exactamente (MUST_MATCH)', value: 'MUST_MATCH' },
              { label: 'Verificar rango (RANGE_CHECK)', value: 'RANGE_CHECK' },
              { label: 'Energía suficiente (POWER_SUFFICIENT)', value: 'POWER_SUFFICIENT' },
              { label: 'Lógica personalizada (CUSTOM)', value: 'CUSTOM' },
            ]}
          />
          <FormSelect
            label="Operador de comparación"
            value={ruleForm.operator}
            onChange={(e) => setRuleForm(curr => ({ ...curr, operator: e.target.value }))}
            options={[
              { label: 'Igual (=)', value: 'EQUALS' },
              { label: 'Mayor o igual (>=)', value: 'GREATER_THAN_OR_EQUAL' },
              { label: 'Menor o igual (<=)', value: 'LESS_THAN_OR_EQUAL' },
            ]}
          />
        </div>
        {ruleModalError && (
          <div className="mt-4 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-600 dark:text-red-200">
            {ruleModalError}
          </div>
        )}
      </Modal>

      <Modal
        open={!!ruleToDelete}
        title="¿Desactivar Regla de Compatibilidad?"
        onClose={() => setRuleToDelete(null)}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-500/10 text-red-500 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                ¿Estás seguro de que deseas desactivar esta regla?
              </p>
              <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Esta acción evitará que el Simulador 3D valide esta restricción de hardware en tiempo real. La regla "{ruleToDelete?.name}" se removerá del motor de validaciones.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-neutral-900">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRuleToDelete(null)}
            >
              Cancelar
            </Button>
            <button
              type="button"
              onClick={() => void handleConfirmDeleteRule()}
              className="rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold px-4 py-2 transition text-xs shadow-sm"
            >
              Sí, desactivar
            </button>
          </div>
        </div>
      </Modal>
    </PageCard>
  );
};
