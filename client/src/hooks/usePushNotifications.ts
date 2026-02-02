import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

// VAPID public key - ในการใช้งานจริงควรเก็บใน environment variable
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer | ArrayBufferLike): string {
  const bytes = new Uint8Array(buffer as ArrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const subscribeMutation = trpc.pushSubscriptions.subscribe.useMutation();
  const unsubscribeMutation = trpc.pushSubscriptions.unsubscribe.useMutation();

  useEffect(() => {
    // Check if push notifications are supported
    const checkSupport = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        setIsSupported(true);
        setPermission(Notification.permission);

        // Check existing subscription
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        
        if (existingSubscription) {
          setSubscription(existingSubscription);
          setIsSubscribed(true);
        }
      }
    };

    checkSupport();
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    const result = await Notification.requestPermission();
    setPermission(result);
    return result === 'granted';
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    
    setIsLoading(true);
    
    try {
      // Request permission first
      const granted = await requestPermission();
      if (!granted) {
        setIsLoading(false);
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Extract keys
      const p256dh = newSubscription.getKey('p256dh');
      const auth = newSubscription.getKey('auth');

      if (!p256dh || !auth) {
        throw new Error('Failed to get push subscription keys');
      }

      // Convert to base64
      const p256dhBase64 = arrayBufferToBase64(p256dh);
      const authBase64 = arrayBufferToBase64(auth);

      // Save to server
      await subscribeMutation.mutateAsync({
        endpoint: newSubscription.endpoint,
        p256dh: p256dhBase64,
        auth: authBase64,
      });

      setSubscription(newSubscription);
      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      setIsLoading(false);
      return false;
    }
  }, [isSupported, requestPermission, subscribeMutation]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!subscription) return false;

    setIsLoading(true);

    try {
      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Remove from server
      await unsubscribeMutation.mutateAsync({
        endpoint: subscription.endpoint,
      });

      setSubscription(null);
      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      setIsLoading(false);
      return false;
    }
  }, [subscription, unsubscribeMutation]);

  // Show a local notification (for testing)
  const showLocalNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (!isSupported || permission !== 'granted') return;

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options,
    });
  }, [isSupported, permission]);

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
    requestPermission,
    showLocalNotification,
  };
}
