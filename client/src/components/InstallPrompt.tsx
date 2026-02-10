import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem('installPromptDismissed')) {
      setDismissed(true);
      return;
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Only show on mobile devices (iOS or Android)
    const userAgent = navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroid = /Android/.test(userAgent);

    if (!isIOS && !isAndroid) {
      return;
    }

    // Android/Chrome install prompt
    if (isAndroid) {
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);
      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }

    // iOS: show manual instructions after a delay
    if (isIOS) {
      setTimeout(() => setShowIOSPrompt(true), 2000);
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    setDismissed(true);
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowIOSPrompt(false);
    setDeferredPrompt(null);
    sessionStorage.setItem('installPromptDismissed', 'true');
  };

  // Don't show if dismissed or no prompt available
  if (dismissed || (!deferredPrompt && !showIOSPrompt)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-parchment-100 border border-accent-500/30 rounded-lg shadow-lg p-4 z-50">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-ink-400 hover:text-ink-600"
        aria-label="Dismiss"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <h3 className="font-serif text-lg text-ink-800 mb-2">Add to Home Screen</h3>

      {deferredPrompt ? (
        <>
          <p className="text-sm text-ink-600 mb-3">
            Install Commonplace Book for quick access and a better experience.
          </p>
          <button
            onClick={handleInstall}
            className="w-full bg-accent-600 text-parchment-50 py-2 px-4 rounded hover:bg-accent-700 transition-colors font-medium"
          >
            Install App
          </button>
        </>
      ) : showIOSPrompt ? (
        <>
          <p className="text-sm text-ink-600 mb-2">
            To add this app to your home screen:
          </p>
          <ol className="text-sm text-ink-600 space-y-1 mb-2">
            <li className="flex items-center gap-2">
              <span>1.</span>
              <span>Tap the Share button</span>
              <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </li>
            <li>2. Scroll down and tap "Add to Home Screen"</li>
          </ol>
        </>
      ) : null}
    </div>
  );
}
