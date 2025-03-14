// src/global.d.ts
declare global {
    interface Window {
      umami: {
        track: (eventName: string, eventData?: Record<string, unknown>) => void;
      };
    }
  }
  
  export {};