import { getCurrentConfig, getCurrentEnvironment } from './config/environments';

// Универсальная конфигурация API URL
const getApiBaseUrl = (): string => {
  // Приоритет 1: Переменная окружения (если установлена)
  if ((import.meta as any).env?.VITE_API_BASE_URL) {
    return (import.meta as any).env.VITE_API_BASE_URL;
  }
  
  // Приоритет 2: Автоматическое определение на основе домена
  const config = getCurrentConfig();
  return config.apiBaseUrl;
};

const API_BASE_URL = getApiBaseUrl();
const currentEnv = getCurrentEnvironment();

export const API_ENDPOINTS = {
  components: `${API_BASE_URL}/components`,
  presets: `${API_BASE_URL}/presets`,
};

export default API_BASE_URL;

// Для отладки
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('📍 Current hostname:', window.location.hostname);
console.log('🔧 Environment:', currentEnv);
console.log('📋 Config:', getCurrentConfig()); 