import { PackageSearch, Plus, Check, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PageCard } from '../../components/ui/PageCard';
import { useAdminCatalog } from './hooks/useAdminCatalog';
import { motion, AnimatePresence } from 'framer-motion';
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
    setCatModalMode,
    setCatForm,
    setRuleModalMode,
    setRuleForm,
    setSelectedCategoryIdForAttr,
    setAttrModalMode,
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
    setActiveTab,
    toastMessage,
    setToastMessage,
    toastTitle,
  } = useAdminCatalog();

  return (
    <PageCard
      title="Gestionar catalogo de componentes"
      text="Administra productos, inventario, disponibilidad y atributos técnicos en una sola vista."
      icon={<PackageSearch className="h-6 w-6" />}
      actions={
        <div className="flex flex-wrap items-center gap-3">
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
            <Button type="button" variant="outlineHoverSolid" className="h-10 px-4 text-sm" onClick={openCreateModal}>
              <Plus className="h-4 w-4" />
              Nuevo componente
            </Button>
          )}
          {activeTab === 'atributos' && (
            <Button type="button" variant="outlineHoverSolid" className="h-10 px-4 text-sm" onClick={openCreateAttrModal}>
              <Plus className="h-4 w-4" />
              Nuevo Atributo
            </Button>
          )}
          {activeTab === 'categorias' && (
            <Button type="button" variant="outlineHoverSolid" className="h-10 px-4 text-sm" onClick={openCreateCatModal}>
              <Plus className="h-4 w-4" />
              Nueva Categoría
            </Button>
          )}
          {activeTab === 'reglas' && (
            <Button type="button" variant="outlineHoverSolid" className="h-10 px-4 text-sm" onClick={openCreateRuleModal}>
              <Plus className="h-4 w-4" />
              Nueva Regla
            </Button>
          )}
        </div>
      }
    >
      {loadError && (
        <div className="mb-4 rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">
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
          selectedComponent={selectedComponent}
          categorySelectOptions={categorySelectOptions}
          categoryAttributesToFill={categoryAttributesToFill}
          productAttributesValues={productAttributesValues}
          resetFilters={resetFilters}
          closeModal={closeModal}
          openEditModal={openEditModal}
          openViewModal={openViewModal}
          openDeleteModal={openDeleteModal}
          handleCategoryChange={handleCategoryChange}
          saveComponent={saveComponent}
          removeComponent={removeComponent}
          categoryFilterOptions={categoryFilterOptions}
          formErrors={formErrors}
          updateFormField={updateFormField}
          attributeErrors={attributeErrors}
          updateAttributeValue={updateAttributeValue}
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
          attrModalError={attrModalError}
          isSavingAttr={isSavingAttr}
          attrToDelete={attrToDelete}
          setAttrToDelete={setAttrToDelete}
          attrToDisassociate={attrToDisassociate}
          setAttrToDisassociate={setAttrToDisassociate}
          categorySelectOptions={categorySelectOptions}
          openEditAttrModal={openEditAttrModal}
          saveAttribute={saveAttribute}
          removeAttribute={removeAttribute}
          handleConfirmDeleteAttribute={handleConfirmDeleteAttribute}
          associateAttr={associateAttr}
          disassociateAttr={disassociateAttr}
          handleConfirmDisassociateAttribute={handleConfirmDisassociateAttribute}
          attrErrors={attrErrors}
          updateAttrFormField={updateAttrFormField}
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
          openEditCatModal={openEditCatModal}
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

      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, x: 20, scale: 0.95, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed top-6 right-6 z-[100] flex items-start gap-4 rounded-xl border border-emerald-250 bg-emerald-50/95 p-5 pr-12 shadow-lg backdrop-blur-sm dark:border-emerald-800/40 dark:bg-emerald-950/90 max-w-md w-full"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400">
              <Check className="h-5.5 w-5.5 stroke-[2.5]" />
            </div>

            <div className="flex-1 text-left min-w-0">
              <h4 className="text-sm font-bold uppercase tracking-wider text-black dark:text-white">
                {toastTitle || '¡ÉXITO!'}
              </h4>
              <p className="mt-0.5 text-sm font-semibold leading-relaxed text-slate-900 dark:text-slate-200">
                {toastMessage}
              </p>
            </div>

            <button
              onClick={() => setToastMessage(null)}
              className="absolute top-4.5 right-3.5 p-0.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4 stroke-[2]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </PageCard>
  );
};
