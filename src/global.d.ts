export {};

declare global {
  interface Window {
    deviceAPI: {
      getDeviceInfo: () => Promise<{
        deviceId: string;
        brand: string;
        model: string;
        systemName: string;
        systemVersion: string;
      }>;
    };

    secureAPI: {
      encrypt: (text: string) => Promise<string>;
      decrypt: (text: string) => Promise<string>;
    };

    storeAPI: {
      set: (key: string, value: any) => Promise<boolean>;
      get: (key: string) => Promise<any>;
      delete: (key: string) => Promise<boolean>;
      has: (key: string) => Promise<boolean>;
      clear: () => Promise<boolean>;
    };
  }
}
