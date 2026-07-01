// Configurações do Microsoft MSAL para SSO
import { Configuration, PublicClientApplication } from '@azure/msal-browser';

// Estas variáveis serão configuradas no Azure AD (Entra ID) do cliente
export const msalConfig: Configuration = {
  auth: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '00000000-0000-0000-0000-000000000000',
    authority: 'https://login.microsoftonline.com/common', // Pode ser alterado para o tenant_id específico se necessário
    redirectUri: window.location.origin + '/auth.html',
    postLogoutRedirectUri: window.location.origin + '/auth.html',
  },
  cache: {
    cacheLocation: 'localStorage',
  }
};

// Expõe a configuração no window para que o popup auth.html possa lê-la de forma dinâmica
(window as any).__msalConfig__ = msalConfig;

export const msalInstance = new PublicClientApplication(msalConfig);

let initializePromise: Promise<void> | null = null;

export function initializeMsal(): Promise<void> {
  if (!initializePromise) {
    initializePromise = msalInstance.initialize().catch((err) => {
      initializePromise = null; // Reseta a promessa para permitir nova tentativa se falhar
      throw err;
    });
  }
  return initializePromise;
}

export const loginRequest = {
  scopes: ['User.Read']
};
