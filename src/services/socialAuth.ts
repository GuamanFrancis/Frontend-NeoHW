import { api } from './api';
import { normalizeAuthResponse } from './authMapper';
import type { AuthResponse, BackendAuthResponse } from '../types/auth';

// Add type declarations for Google and Facebook SDKs on window object
declare global {
  interface Window {
    google?: any;
    FB?: any;
    fbAsyncInit?: () => void;
  }
}

let googleSdkPromise: Promise<void> | null = null;
let facebookSdkPromise: Promise<void> | null = null;

/**
 * Dynamically loads and initializes the Google Identity Services SDK.
 */
export const initGoogleSdk = (): Promise<void> => {
  if (googleSdkPromise) return googleSdkPromise;

  googleSdkPromise = new Promise((resolve) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      console.error('Failed to load Google SDK script');
      resolve(); // Resolve anyway to avoid blocking execution
    };
    document.head.appendChild(script);
  });

  return googleSdkPromise;
};

/**
 * Dynamically loads and initializes the Facebook SDK.
 */
export const initFacebookSdk = (): Promise<void> => {
  if (facebookSdkPromise) return facebookSdkPromise;

  facebookSdkPromise = new Promise((resolve) => {
    if (window.FB) {
      resolve();
      return;
    }

    window.fbAsyncInit = function () {
      const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
      if (!appId) {
        console.warn('VITE_FACEBOOK_APP_ID is not defined in frontend env');
      }

      window.FB.init({
        appId: appId || '',
        cookie: true,
        xfbml: true,
        version: 'v18.0',
      });
      resolve();
    };

    // Load SDK script
    const script = document.createElement('script');
    script.id = 'facebook-jssdk';
    script.src = 'https://connect.facebook.net/en_US/sdk.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Script is loaded, fbAsyncInit will trigger initialization
    };
    script.onerror = () => {
      console.error('Failed to load Facebook SDK script');
      resolve();
    };
    document.head.appendChild(script);
  });

  return facebookSdkPromise;
};

/**
 * Authenticates with Google and returns the backend session.
 */
export const handleGoogleLogin = async (idToken: string): Promise<AuthResponse> => {
  const { data } = await api.post<BackendAuthResponse>('/auth/social/google', {
    token: idToken,
  });
  return normalizeAuthResponse(data);
};

/**
 * Authenticates with Facebook and returns the backend session.
 */
export const handleFacebookLogin = async (accessToken: string): Promise<AuthResponse> => {
  const { data } = await api.post<BackendAuthResponse>('/auth/social/facebook', {
    token: accessToken,
  });
  return normalizeAuthResponse(data);
};

/**
 * Triggers Facebook Sign-In flow via popup and returns the access token.
 */
export const triggerFacebookAuth = async (): Promise<string> => {
  await initFacebookSdk();

  return new Promise((resolve, reject) => {
    if (!window.FB) {
      reject(new Error('El SDK de Facebook no se ha cargado.'));
      return;
    }

    window.FB.login(
      (response: any) => {
        if (response.authResponse?.accessToken) {
          resolve(response.authResponse.accessToken);
        } else {
          reject(new Error('El usuario canceló el inicio de sesión de Facebook o no autorizó la aplicación.'));
        }
      },
      { scope: 'public_profile,email' }
    );
  });
};
