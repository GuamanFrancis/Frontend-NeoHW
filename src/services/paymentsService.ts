import { api } from './api';

export type StripeSessionResponse = {
  sessionId: string;
  url: string;
};

export const createStripeSession = async (orderId: string): Promise<StripeSessionResponse> => {
  const { data } = await api.post<StripeSessionResponse>('/payments/stripe/create-checkout-session', {
    orderId,
  });
  return data;
};
