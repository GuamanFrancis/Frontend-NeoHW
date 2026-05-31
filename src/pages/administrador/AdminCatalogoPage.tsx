import { PackageSearch, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PageCard } from '../../components/ui/PageCard';
import { useAdminCatalog } from './hooks/useAdminCatalog';
import { CatalogTab } from './components/CatalogTab';
import { AttributesTab } from './components/AttributesTab';
import { CategoriesTab } from './components/CategoriesTab';
import { RulesTab } from './components/RulesTab';

export const AdminCatalogoPage = () => {
  const {
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
    setCatToDelete,
    catForm,
    compatibilityRulesList,
    ruleModalMode,
    isSavingRule,
    ruleModalError,
    ruleToDelete,
    setRuleToDelete,
    ruleForm,
    globalAttributes,
    selectedCategoryIdForAttr,
    categoryAttrs,
    attrModalMode,
    attrForm,
    attrModalError,
    isSavingAttr,
    categoryAttributesToFill,
    productAttributesValues,
    attrToDelete,
    setAttrToDelete,
    attrToDisassociate,
    setAttrToDisassociate,
    setSearch,
    setCategoryFilter,
    setStatusFilter,
    setPageSize,
    setCurrentPage,
    setFormValues,
    setCatModalMode,
    setCatForm,
    setRuleModalMode,
    setRuleForm,
    setSelectedCategoryIdForAttr,
    setAttrModalMode,
    setAttrForm,
    setProductAttributesValues,
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
    setActiveTab,
  } = useAdminCatalog();

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
        <CatalogTab
          search={search}
          setSearch={setSearch}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          pageSize={pageSize}
          setPageSize={setPageSize}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageComponents={pageComponents}
          filteredComponents={filteredComponents}
          firstResult={firstResult}
          lastResult={lastResult}
          totalPages={totalPages}
          pagesToShow={pagesToShow}
          isLoading={isLoading}
          isSaving={isSaving}
          modalMode={modalMode}
          modalError={modalError}
          formValues={formValues}
          setFormValues={setFormValues}
          selectedComponent={selectedComponent}
          categorySelectOptions={categorySelectOptions}
          categoryAttributesToFill={categoryAttributesToFill}
          productAttributesValues={productAttributesValues}
          setProductAttributesValues={setProductAttributesValues}
          resetFilters={resetFilters}
          closeModal={closeModal}
          openEditModal={openEditModal}
          openViewModal={openViewModal}
          openDeleteModal={openDeleteModal}
          handleCategoryChange={handleCategoryChange}
          saveComponent={saveComponent}
          removeComponent={removeComponent}
          categoryFilterOptions={categoryFilterOptions}
        />
      )}

      {activeTab === 'atributos' && (
        <AttributesTab
          globalAttributes={globalAttributes}
          selectedCategoryIdForAttr={selectedCategoryIdForAttr}
          setSelectedCategoryIdForAttr={setSelectedCategoryIdForAttr}
          categoryAttrs={categoryAttrs}
          attrModalMode={attrModalMode}
          setAttrModalMode={setAttrModalMode}
          attrForm={attrForm}
          setAttrForm={setAttrForm}
          attrModalError={attrModalError}
          isSavingAttr={isSavingAttr}
          attrToDelete={attrToDelete}
          setAttrToDelete={setAttrToDelete}
          attrToDisassociate={attrToDisassociate}
          setAttrToDisassociate={setAttrToDisassociate}
          categorySelectOptions={categorySelectOptions}
          openCreateAttrModal={openCreateAttrModal}
          openEditAttrModal={openEditAttrModal}
          saveAttribute={saveAttribute}
          removeAttribute={removeAttribute}
          handleConfirmDeleteAttribute={handleConfirmDeleteAttribute}
          associateAttr={associateAttr}
          disassociateAttr={disassociateAttr}
          handleConfirmDisassociateAttribute={handleConfirmDisassociateAttribute}
        />
      )}

      {activeTab === 'categorias' && (
        <CategoriesTab
          categories={categories}
          catModalMode={catModalMode}
          setCatModalMode={setCatModalMode}
          isSavingCat={isSavingCat}
          catModalError={catModalError}
          catToDelete={catToDelete}
          setCatToDelete={setCatToDelete}
          catForm={catForm}
          setCatForm={setCatForm}
          saveCategoryAction={saveCategoryAction}
          deleteCategoryAction={deleteCategoryAction}
          handleConfirmDeleteCategory={handleConfirmDeleteCategory}
        />
      )}

      {activeTab === 'reglas' && (
        <RulesTab
          compatibilityRulesList={compatibilityRulesList}
          ruleModalMode={ruleModalMode}
          setRuleModalMode={setRuleModalMode}
          isSavingRule={isSavingRule}
          ruleModalError={ruleModalError}
          ruleToDelete={ruleToDelete}
          setRuleToDelete={setRuleToDelete}
          ruleForm={ruleForm}
          setRuleForm={setRuleForm}
          globalAttributes={globalAttributes}
          saveCompatibilityRuleAction={saveCompatibilityRuleAction}
          deleteCompatibilityRuleAction={deleteCompatibilityRuleAction}
          handleConfirmDeleteRule={handleConfirmDeleteRule}
        />
      )}
    </PageCard>
  );
};
