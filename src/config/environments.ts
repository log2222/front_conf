import { Environments, EnvironmentConfig } from '../types/api';

// Конфигурации для разных окружений
export const environments: Environments = {
  development: {
    apiBaseUrl: 'http://localhost:8000',
    name: 'Development'
  },
  production: {
    apiBaseUrl: 'https://bconf.onrender.com',
    name: 'Production'
  },
  staging: {
    apiBaseUrl: 'https://bconf-staging.onrender.com', // если есть staging
    name: 'Staging'
  }
};

// Определение текущего окружения
export const getCurrentEnvironment = (): keyof Environments => {
  const hostname = window.location.hostname;
  
  // Локальная разработка
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
    return 'development';
  }
  
  // Продакшн (Vercel, Netlify, etc.)
  if (hostname.includes('vercel.app') || 
      hostname.includes('netlify.app') || 
      hostname.includes('github.io')) {
    return 'production';
  }
  
  // Staging (если есть)
  if (hostname.includes('staging')) {
    return 'staging';
  }
  
  // По умолчанию продакшн
  return 'production';
};

export const getCurrentConfig = (): EnvironmentConfig => {
  const env = getCurrentEnvironment();
  return environments[env] || environments.production;
}; 