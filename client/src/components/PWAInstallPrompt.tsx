import { useState, useEffect } from 'react';
import Button from './ui/Button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    console.log('🔧 [PWA] Component mounted');
    
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    console.log('🔧 [PWA] Is standalone:', isStandalone);
    console.log('🔧 [PWA] Is iOS web app:', isInWebAppiOS);
    console.log('🔧 [PWA] Protocol:', window.location.protocol);
    console.log('🔧 [PWA] Host:', window.location.host);
    console.log('🔧 [PWA] User Agent:', navigator.userAgent);
    
    if (isStandalone || isInWebAppiOS) {
      console.log('🔧 [PWA] Already installed, hiding button');
      setShowInstallButton(false);
      return;
    }

    const handler = (e: Event) => {
      console.log('🔧 [PWA] ✅ beforeinstallprompt event fired!');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
      setIsTestMode(false);
    };

    window.addEventListener('beforeinstallprompt', handler);
    console.log('🔧 [PWA] Event listener added');

    // Wait longer for the event (5 seconds instead of 3)
    // Chrome needs time to determine if PWA criteria are met
    const testTimer = setTimeout(() => {
      if (!deferredPrompt && !isStandalone && !isInWebAppiOS) {
        console.log('🔧 [PWA] ⚠️ beforeinstallprompt event not fired after 5s');
        console.log('🔧 [PWA] Possible reasons:');
        console.log('  - PWA criteria not fully met');
        console.log('  - User engagement too low');
        console.log('  - Already dismissed recently');
        console.log('  - Browser doesn\'t support PWA');
        console.log('🔧 [PWA] Showing button with manual instructions');
        setShowInstallButton(true);
        setIsTestMode(true);
      }
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(testTimer);
      console.log('🔧 [PWA] Component unmounted');
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    console.log('🔧 [PWA] Install button clicked');
    console.log('🔧 [PWA] Test mode:', isTestMode);
    console.log('🔧 [PWA] Has deferred prompt:', !!deferredPrompt);
    
    // Try to use deferred prompt first
    if (deferredPrompt && !isTestMode) {
      try {
        console.log('🔧 [PWA] Showing native install prompt');
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('🔧 [PWA] User choice:', outcome);

        if (outcome === 'accepted') {
          console.log('🔧 [PWA] PWA installed successfully');
        } else {
          console.log('🔧 [PWA] User dismissed the install prompt');
        }
        
        setDeferredPrompt(null);
        setShowInstallButton(false);
        return;
      } catch (error) {
        console.error('🔧 [PWA] Install error:', error);
      }
    }
    
    // Fallback: Show instructions
    console.log('🔧 [PWA] Showing manual instructions');
    
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let instructions = 'O\'rnatish uchun:\n\n';
    
    if (isIOS) {
      instructions += 'iOS Safari:\n1. Pastdagi Share tugmasini bosing\n2. "Add to Home Screen" ni tanlang';
    } else if (isAndroid) {
      instructions += 'Android Chrome:\n1. Manzil satridagi ⋮ (3 nuqta) ni bosing\n2. "Add to Home screen" ni tanlang\n\nYoki:\nManzil satridagi ⊕ belgisini bosing';
    } else {
      instructions += 'Chrome/Edge:\n1. Manzil satridagi ⊕ belgisini bosing\n2. "O\'rnatish" ni tanlang\n\nYoki:\n1. ⋮ (3 nuqta) → "Install Universal.uz"';
    }
    
    alert(instructions);
  };

  if (!showInstallButton) {
    console.log('🔧 [PWA] Button hidden');
    return null;
  }

  console.log('🔧 [PWA] Rendering install button (test mode:', isTestMode, ')');

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border-2 border-primary-500 rounded-lg shadow-2xl p-4 z-50 animate-fade-up">
      {isTestMode && (
        <div className="mb-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
          ⚠️ Test rejimi - Qo'lda o'rnatish yo'riqnomasi
        </div>
      )}
      <div className="flex items-start gap-3">
        <img src="/logo.jpg" alt="Universal" className="w-12 h-12 rounded-lg" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            📱 Ilovani o'rnating
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
              onClick={() => {
                console.log('🔧 [PWA] User clicked "Later"');
                setShowInstallButton(false);
              }}
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
