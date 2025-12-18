// app/config/api.ts (or app/config/api.js if not using TypeScript)

const isDevelopment = __DEV__;

export const API_CONFIG = {
  BASE_URL: isDevelopment 
    ? 'http://172.16.253.11:3001' 
    : 'https://discerning-charisma-production-b8f6.up.railway.app',
};

// Optional: Add specific endpoints for cleaner code
export const API_ENDPOINTS = {
  REPORT_HARASSMENT: '/report-harassment',
  SOS: '/sos',
  POSTS: '/posts',
  HEATMAP: '/heatmap',
};