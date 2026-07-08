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
      let errorMessage = 'No se pudo conectar con el servidor de IA.';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = `Error ${response.status}: ${response.statusText || errorMessage}`;
      }

      if (response.status === 429) {
        errorMessage = 'Límite de solicitudes de IA excedido. Por favor, intenta de nuevo en unos minutos.';
      }

      const errorObj = new Error(errorMessage) as any;
      errorObj.status = response.status;
      throw errorObj;
    }

    const data: { role: string; content: string } = await response.json();
    const fullText = data.content || '';

    // Simulate word-by-word streaming locally to maintain the premium live typing aesthetic in the UI
    const words = fullText.split(/(\s+)/);
    let currentIndex = 0;

    const streamInterval = setInterval(() => {
      if (currentIndex < words.length) {
        const wordChunk = words[currentIndex];
        if (wordChunk) {
          onChunk(wordChunk);
        }
        currentIndex++;
      } else {
        clearInterval(streamInterval);
        onComplete(fullText);
      }
    }, 15); // 15ms interval for a fast and natural typing animation

  } catch (error) {
    onError(error);
  }
};
