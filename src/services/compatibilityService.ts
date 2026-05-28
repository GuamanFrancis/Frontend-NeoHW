import { api } from './api';
export type CompatibilityCheckResult = {
  ruleId: string;
  ruleName: string;
  ruleType: string;
  sourceProductId: string;
  targetProductId: string;
  sourceProduct: { id: string; name: string };
  targetProduct: { id: string; name: string };
  status: 'PASS' | 'FAIL' | 'WARN';
  detail: string;
};
export type CheckCompatibilityResponse = {
  compatible: boolean;
  results: CompatibilityCheckResult[];
};
export type CompatibilityRule = {
  id: string;
  name: string;
  description: string;
  ruleType: string;
  sourceCategory: { id: string; name: string };
  targetCategory: { id: string; name: string };
  sourceAttributeName: string;
  targetAttributeName: string;
  comparisonOperator: string;
  isActive: boolean;
};
export const checkCompatibility = async (productIds: string[]): Promise<CheckCompatibilityResponse> => {
  const { data } = await api.post<CheckCompatibilityResponse>('/compatibility/check', { productIds });
  return data;
};
export const getCompatibilityRules = async (): Promise<{ data: CompatibilityRule[]; total: number }> => {
  const { data } = await api.get<{ data: CompatibilityRule[]; total: number }>('/compatibility/rules');
  return data;
};

export const createCompatibilityRule = async (payload: {
  name: string;
  description?: string;
  sourceAttributeId: string;
  targetAttributeId: string;
  ruleType: 'MUST_MATCH' | 'RANGE_CHECK' | 'POWER_SUFFICIENT' | 'CUSTOM';
  condition: Record<string, any>;
}): Promise<any> => {
  const { data } = await api.post<{ message: string; rule: any }>('/compatibility/rules', payload);
  return data.rule;
};

export const deleteCompatibilityRule = async (id: string): Promise<void> => {
  await api.delete(`/compatibility/rules/${id}`);
};

