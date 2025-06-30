import { useState, useEffect } from 'react';
import { getCurrentConfig, getCurrentEnvironment } from '../config/environments';
import { ApiConfig } from '../types/api';

export const useApiConfig = (): ApiConfig => {
  const [config, setConfig] = useState<ApiConfig>(() => {
    const currentConfig = getCurrentConfig();
    const currentEnv = getCurrentEnvironment();
    
    return {
      apiBaseUrl: currentConfig.apiBaseUrl,
      environment: currentEnv,
      isDevelopment: currentEnv === 'development',
      isProduction: currentEnv === 'production'
    };
  });

  useEffect(() => {
    // Логирование для отладки
    console.log('🔧 API Config initialized:', config);
  }, [config]);

  return config;
};

// Утилиты для работы с API
export const createApiUrl = (endpoint: string): string => {
  const { apiBaseUrl } = getCurrentConfig();
  return `${apiBaseUrl}${endpoint}`;
};

export const getApiEndpoints = () => {
  const { apiBaseUrl } = getCurrentConfig();
  return {
    components: `${apiBaseUrl}/components`,
    presets: `${apiBaseUrl}/presets`,
  };
}; 