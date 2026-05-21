import { getStoredAccessToken } from './session';
export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};
export const streamAiChat = async (
  messages: ChatMessage[],
  onChunk: (chunk: string) => void,
  onComplete: (fullText: string) => void,
  onError: (err: any) => void
) => {
  try {
    const token = getStoredAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch('/ai/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ messages }),
    });
    if (!response.ok) {
      throw new Error(`Error en el servidor de IA: ${response.statusText}`);
    }
    if (!response.body) {
      throw new Error('El cuerpo de la respuesta no es legible por el lector de streams.');
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullText = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;
      onChunk(chunk);
    }
    onComplete(fullText);
  } catch (error) {
    onError(error);
  }
};
