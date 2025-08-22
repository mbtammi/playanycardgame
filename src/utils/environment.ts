// Environment utilities
export const isDevelopment = import.meta.env.VITE_APP_ENV === 'development' || import.meta.env.DEV;
export const isProduction = import.meta.env.VITE_APP_ENV === 'production' || import.meta.env.PROD;

// Get the default page based on environment
export const getDefaultPage = (): string => {
  // In development, show examples page for easy testing
  if (isDevelopment) {
    return import.meta.env.VITE_DEFAULT_PAGE || 'examples';
  }
  
  // In production, show newsletter signup
  if (isProduction) {
    return import.meta.env.VITE_DEFAULT_PAGE || 'newsletter';
  }
  
  // Fallback
  return 'newsletter';
};

// Environment info for debugging
export const envInfo = {
  isDevelopment,
  isProduction,
  env: import.meta.env.VITE_APP_ENV,
  mode: import.meta.env.MODE,
  defaultPage: getDefaultPage()
};

console.log('🌍 Environment Info:', envInfo);
