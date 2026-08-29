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

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let scriptLoading: Promise<void> | null = null;

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

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ onCredential, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!env.googleClientId) {
      setUnavailable(true);
      return;
    }

    loadGisScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;

        window.google!.accounts.id.initialize({
          client_id: env.googleClientId,
          callback: (response: { credential?: string }) => {
            if (response.credential) {
              onCredential(response.credential);
            }
          },
        });

        window.google!.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          width: 360,
          text: 'continue_with',
          shape: 'rectangular',
        });
      })
      .catch(() => {
        if (!cancelled) {
          setUnavailable(true);
          onError?.('Google sign-in is unavailable right now.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [onCredential, onError]);

  if (unavailable || !env.googleClientId) {
    return (
      <button
        type="button"
        disabled
        className="w-full py-2.5 bg-slate-100 text-slate-400 font-medium rounded-lg border border-slate-200 flex items-center justify-center space-x-3 text-sm cursor-not-allowed"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span>Google sign-in not configured</span>
      </button>
    );
  }

  return <div ref={containerRef} className="flex justify-center" />;
};

export default GoogleSignInButton;
