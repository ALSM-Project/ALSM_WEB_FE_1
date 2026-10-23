import React, { useEffect, useRef, useState } from 'react';
import { env } from '@/shared/constants/env';

// Google Identity Services (GIS) "Sign in with Google" button.
// Loads the official GIS script, renders the button, and surfaces the ID token
// via onCredential. The ID token is sent to POST /auth/google on the backend
// (GIS ID-token flow — no OAuth redirect/callback).

interface GoogleSignInButtonProps {
  onCredential: (idToken: string) => void;
  onError?: (message: string) => void;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (element: HTMLElement, config: Record<string, unknown>) => void;
          prompt?: () => void;
        };
      };
    };
  }
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client?hl=en';

let scriptLoading: Promise<void> | null = null;
let initializedClientId: string | null = null;

function loadGisScript(): Promise<void> {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }
  if (!scriptLoading) {
    scriptLoading = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }
  return scriptLoading;
}

function initializeGis(clientId: string, callback: (response: { credential?: string }) => void) {
  if (initializedClientId === clientId && window.google?.accounts?.id) {
    return;
  }
  if (window.google?.accounts?.id) {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback,
    });
    initializedClientId = clientId;
  }
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onCredential, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onCredentialRef.current = onCredential;
    onErrorRef.current = onError;
  }, [onCredential, onError]);

  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;

    if (!env.googleClientId) {
      setUnavailable(true);
      return;
    }

    const render = (width: number) => {
      if (cancelled || !containerRef.current || !window.google?.accounts?.id) return;
      initializeGis(env.googleClientId, (response: { credential?: string }) => {
        if (response.credential) {
          onCredentialRef.current(response.credential);
        }
      });
      containerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width,
        text: 'signin_with',
        shape: 'rectangular',
      });
    };

    loadGisScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.google?.accounts?.id) return;
        render(containerRef.current.clientWidth);
        // Re-render at the measured width so the button fills the form column,
        // matching the full-width Sign In button above it.
        observer = new ResizeObserver((entries) => {
          const width = entries[0]?.contentRect.width;
          if (width) render(width);
        });
        observer.observe(containerRef.current);
      })
      .catch(() => {
        if (!cancelled) {
          setUnavailable(true);
          onErrorRef.current?.('Google sign-in is unavailable right now.');
        }
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, []);

  if (unavailable || !env.googleClientId) {
    return null;
  }

  return <div ref={containerRef} className="w-full flex justify-center" />;
};

export default GoogleSignInButton;
