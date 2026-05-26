import { api } from './api';

export type AttributeDataType = 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'SELECT' | 'MULTI_SELECT';

export type BackendAttribute = {
  id: string;
  name: string;
  slug: string;
  dataType: AttributeDataType;
  unit: string | null;
  isFilterable: boolean;
  isRequired: boolean;
  options: string[] | null;
};

export type ProductAttributeValue = {
  attributeId: string;
  value: string;
};

export type AttributeValueDetail = {
  attribute: {
    id: string;
    name: string;
    slug: string;
    unit: string | null;
  };
  value: string;
};

export const getAttributes = async (): Promise<BackendAttribute[]> => {
  const { data } = await api.get<{ data: BackendAttribute[]; total: number }>('/attributes');
  return data.data;
};

export const createAttribute = async (payload: {
  name: string;
  slug?: string;
  dataType: AttributeDataType;
  unit?: string | null;
  isFilterable?: boolean;
  isRequired?: boolean;
  options?: string[] | null;
}): Promise<BackendAttribute> => {
  const { data } = await api.post<{ message: string; attribute: BackendAttribute }>('/attributes', payload);
  return data.attribute;
};

export const updateAttribute = async (
  id: string,
  payload: Partial<{
    name: string;
    slug?: string;
    dataType: AttributeDataType;
    unit?: string | null;
    isFilterable?: boolean;
    isRequired?: boolean;
    options?: string[] | null;
  }>,
): Promise<BackendAttribute> => {
  const { data } = await api.patch<{ message: string; attribute: BackendAttribute }>(`/attributes/${id}`, payload);
  return data.attribute;
};

export const deleteAttribute = async (id: string): Promise<void> => {
  await api.delete(`/attributes/${id}`);
};

export const getAttributesByCategory = async (categoryId: string): Promise<BackendAttribute[]> => {
  const { data } = await api.get<{ data: BackendAttribute[]; total: number }>(`/categories/${categoryId}/attributes`);
  return data.data;
};

export const associateAttributeToCategory = async (
  categoryId: string,
  attributeId: string,
): Promise<void> => {
  await api.post(`/categories/${categoryId}/attributes`, { attributeId });
};

export const removeAttributeFromCategory = async (
  categoryId: string,
  attributeId: string,
): Promise<void> => {
  await api.delete(`/categories/${categoryId}/attributes/${attributeId}`);
};

export const getProductAttributes = async (productId: string): Promise<AttributeValueDetail[]> => {
  const { data } = await api.get<{ attributes: any[] }>(`/products/${productId}/attributes`);
  return data.attributes.map((attr) => ({
    attribute: {
      id: attr.attributeId,
      name: attr.attributeName,
      slug: attr.attributeSlug,
      unit: attr.unit,
    },
    value: attr.value,
  }));
};

export const setProductAttributes = async (
  productId: string,
  attributes: ProductAttributeValue[],
): Promise<void> => {
  await api.post(`/products/${productId}/attributes`, { attributes });
};

export const updateProductAttributes = async (
  productId: string,
  attributes: ProductAttributeValue[],
): Promise<void> => {
  await api.patch(`/products/${productId}/attributes`, { attributes });
};
