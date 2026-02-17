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
      setIsTestMode(false);
    };

    window.addEventListener('beforeinstallprompt', handler);
    console.log('🔧 [PWA] Event listener added');

    // For development/testing - show button after 3 seconds if event doesn't fire
    // This helps test the UI even if PWA criteria aren't met
    const testTimer = setTimeout(() => {
      if (!deferredPrompt && !isStandalone && !isInWebAppiOS) {
        console.log('🔧 [PWA] Event not fired after 3s, showing test button');
        console.log('🔧 [PWA] This might be because:');
        console.log('  - Not HTTPS (current:', window.location.protocol, ')');
        console.log('  - Already installed');
        console.log('  - Browser doesn\'t support PWA');
        console.log('  - Manifest.json issues');
        setShowInstallButton(true);
        setIsTestMode(true);
      }
    }, 3000);

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
    
    if (!deferredPrompt || isTestMode) {
      console.log('🔧 [PWA] No deferred prompt or test mode - showing instructions');
      
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
      
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        instructions += '\n\n⚠️ Eslatma: PWA faqat HTTPS da ishlaydi';
      }
      
      alert(instructions);
      return;
    }

    try {
      console.log('🔧 [PWA] Showing install prompt');
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log('🔧 [PWA] User choice:', outcome);

      if (outcome === 'accepted') {
        console.log('🔧 [PWA] PWA installed successfully');
      } else {
        console.log('🔧 [PWA] User dismissed the install prompt');
      }
    } catch (error) {
      console.error('🔧 [PWA] Install error:', error);
    }

    setDeferredPrompt(null);
    setShowInstallButton(false);
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
          ⚠️ Test rejimi - PWA event ishlamadi
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
              {isTestMode ? 'Ko\'rsatma' : 'O\'rnatish'}
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
