import { useState, useEffect } from 'react';
import Button from './ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    console.log('🔧 [PWA] Component mounted');
    
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    console.log('🔧 [PWA] Is standalone:', isStandalone);
    console.log('🔧 [PWA] Is iOS web app:', isInWebAppiOS);
    
    if (isStandalone || isInWebAppiOS) {
      console.log('🔧 [PWA] Already installed, hiding button');
      setShowInstallButton(false);
      return;
    }

    const handler = (e: Event) => {
      console.log('🔧 [PWA] beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    console.log('🔧 [PWA] Event listener added');

    // For testing - show button after 2 seconds if event doesn't fire
    const testTimer = setTimeout(() => {
      if (!deferredPrompt && !isStandalone && !isInWebAppiOS) {
        console.log('🔧 [PWA] Event not fired, showing test button');
        setShowInstallButton(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(testTimer);
      console.log('🔧 [PWA] Component unmounted');
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('PWA installed');
    }

    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  if (!showInstallButton) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-start gap-3">
        <img src="/logo.jpg" alt="Universal" className="w-12 h-12 rounded-lg" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            Ilovani o'rnating
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Tezroq kirish uchun Universal.uz ni telefoningizga o'rnating
          </p>
          <div className="flex gap-2">
            <Button
              onClick={handleInstallClick}
              className="flex-1"
            >
              O'rnatish
            </Button>
            <Button
              onClick={() => setShowInstallButton(false)}
              variant="ghost"
            >
              Keyinroq
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
