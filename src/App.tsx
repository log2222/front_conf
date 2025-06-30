import React, { useState, useEffect } from 'react';
import { Container, Box, Typography, Card, Divider, ToggleButton, ToggleButtonGroup, Button } from '@mui/material';
import PresetSelector from './components/PresetSelector';
import ComponentSelector from './components/ComponentSelector';
import BuildSummary from './components/BuildSummary';
import axios from 'axios';

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

  useEffect(() => {
    axios.get('https://bconf.onrender.com/components')
      .then(res => setComponents(res.data));
  }, []);

  const handlePresetSelect = (presetComponents: SelectedComponents) => {
    setSelected(presetComponents);
  };

  const clearSelection = () => {
    setSelected({});
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Конфигуратор ПК
      </Typography>
      
      <Box mb={3}>
        <Typography variant="h6" gutterBottom>Готовые конфигурации</Typography>
        <PresetSelector onSelect={handlePresetSelect} />
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box mb={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Выбор комплектующих</Typography>
          <Box>
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
              sx={{ ml: 2 }}
            >
              Очистить
            </Button>
          </Box>
        </Box>
        
        <Card sx={{ p: 3 }}>
          <ComponentSelector 
            selected={selected} 
            setSelected={setSelected} 
            viewMode={viewMode} 
          />
        </Card>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box>
        <Card sx={{ p: 3 }}>
          <BuildSummary selected={selected} components={components} />
        </Card>
      </Box>
    </Container>
  );
};

export default App; 
