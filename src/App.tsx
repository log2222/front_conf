import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Card, Divider, ToggleButton, ToggleButtonGroup, Button, Chip } from '@mui/material';
import PresetSelector from './components/PresetSelector';
import ComponentSelector from './components/ComponentSelector';
import BuildSummary from './components/BuildSummary';
import axios from 'axios';
import { API_ENDPOINTS } from './config';
import { useApiConfig } from './hooks/useApiConfig';

interface ComponentOption {
  name: string;
  price: number;
}

interface ComponentsData {
  [category: string]: ComponentOption[];
}

interface SelectedComponents {
  [category: string]: string | string[];
}

const App: React.FC = () => {
  const [selected, setSelected] = useState<SelectedComponents>({});
  const [components, setComponents] = useState<ComponentsData>({});
  const [viewMode, setViewMode] = useState<'full' | 'short'>('full');
  
  // Используем новый хук для конфигурации
  const apiConfig = useApiConfig();

  useEffect(() => {
    console.log('Loading components from:', API_ENDPOINTS.components);
    console.log('Current environment:', apiConfig.environment);
    
    axios.get(API_ENDPOINTS.components)
      .then(res => {
        console.log('Components loaded successfully:', Object.keys(res.data));
        setComponents(res.data);
      })
      .catch(error => {
        console.error('Error loading components:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url
        });
      });
  }, [apiConfig.environment]);

  const handlePresetSelect = (presetComponents: SelectedComponents) => {
    setSelected(presetComponents);
  };

  const clearSelection = () => {
    setSelected({});
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 1, sm: 2, md: 4 }, px: { xs: 0.5, sm: 2 }, minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        Конфигуратор ПК
      </Typography>
      
      {/* Индикатор окружения (только в development) */}
      {apiConfig.isDevelopment && (
        <Box mb={2} display="flex" justifyContent="center">
          <Chip 
            label={`${apiConfig.environment.toUpperCase()} - ${apiConfig.apiBaseUrl}`}
            color="warning"
            size="small"
          />
        </Box>
      )}
      
      <Box mb={3}>
        <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Готовые конфигурации</Typography>
        <PresetSelector onSelect={handlePresetSelect} />
      </Box>

      <Divider sx={{ my: { xs: 2, sm: 3 } }} />

      <Box mb={3}>
        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} mb={2} gap={1}>
          <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Выбор комплектующих</Typography>
          <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={1}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="full">Полный</ToggleButton>
              <ToggleButton value="short">Краткий</ToggleButton>
            </ToggleButtonGroup>
            <Button 
              variant="outlined" 
              onClick={clearSelection}
              sx={{ ml: { xs: 0, sm: 2 }, mt: { xs: 1, sm: 0 }, minWidth: { xs: 100, sm: 120 } }}
            >
              Очистить
            </Button>
          </Box>
        </Box>
        
        <Card sx={{ p: { xs: 1, sm: 3 } }}>
          <ComponentSelector 
            selected={selected} 
            setSelected={setSelected} 
            viewMode={viewMode} 
          />
        </Card>
      </Box>

      <Divider sx={{ my: { xs: 2, sm: 3 } }} />

      <Box>
        <Card sx={{ p: { xs: 1, sm: 3 } }}>
          <BuildSummary selected={selected} components={components} />
        </Card>
      </Box>
    </Container>
  );
};

export default App; 