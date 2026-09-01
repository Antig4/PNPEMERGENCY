export interface SystemNotification {
  id: string;
  type: 'NEW_INCIDENT' | 'REASSIGNMENT' | 'CANCELLATION' | 'ADMIN_MESSAGE';
  title: string;
  body: string;
  data?: any;
  timestamp: string;
  read: boolean;
}

export const notificationService = {
  /**
   * Initializes notification handlers (Expo Notifications readiness)
   */
  async initialize(): Promise<void> {
    console.log('[notificationService] Notification channel initialized.');
  },

  /**
   * Register device push notification token
   */
  async registerForPushNotifications(): Promise<string | null> {
    // Prepared for Expo Notifications token registration:
    // const { status } = await Notifications.requestPermissionsAsync();
    // const token = (await Notifications.getExpoPushTokenAsync()).data;
    const mockPushToken = `ExponentPushToken[mock_patrol_${Date.now()}]`;
    return mockPushToken;
  },

  /**
   * Simulates dispatching emergency notification alert to officer for thesis evaluation
   */
  createMockDispatchNotification(incidentId: string = 'INC-00021'): SystemNotification {
    return {
      id: `NOTIF-${Date.now()}`,
      type: 'NEW_INCIDENT',
      title: '🚨 NEW EMERGENCY DISPATCH',
      body: `Assigned emergency ${incidentId}: Crime / Police Emergency in Butuan area (0.8 km away).`,
      data: {
        incidentId,
        emergencyType: 'Crime / Police Emergency',
        distanceKm: 0.8,
        latitude: 8.9475,
        longitude: 125.5406,
        citizenName: 'Juan dela Cruz (Registered Citizen)',
        contactNumber: '0917 123 4567',
      },
      timestamp: new Date().toISOString(),
      read: false,
    };
  }
};
