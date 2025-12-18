import React, { useEffect } from 'react';
import Constants from 'expo-constants';

interface NotificationSetupProps {
    children: React.ReactNode;
}

const NotificationSetup: React.FC<NotificationSetupProps> = ({ children }) => {
    useEffect(() => {
        // Check if running in Expo Go
        const isExpoGo = Constants.executionEnvironment === 'storeClient';

        if (isExpoGo) {
            console.log('Running in Expo Go - push notifications disabled');
            return;
        }

        // Only initialize notifications in development builds
        const initializeNotifications = async () => {
            try {
                const { registerForPushNotificationsAsync, setupNotificationListeners } = await import('../services/notificationService');
                await registerForPushNotificationsAsync();
                console.log('Notifications initialized successfully');

                // Setup notification listeners
                const removeListeners = setupNotificationListeners();

                // Cleanup listeners when component unmounts
                return () => {
                    if (removeListeners) {
                        removeListeners();
                    }
                };
            } catch (error) {
                console.error('Failed to initialize notifications:', error);
            }
        };

        const cleanup = initializeNotifications();

        return () => {
            if (cleanup instanceof Promise) {
                cleanup.then(cleanupFn => cleanupFn?.());
            }
        };
    }, []);

    return <>{children}</>;
};

export default NotificationSetup;