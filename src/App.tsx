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
  [category: string]: string;
}

const App: React.FC = () => {
  const [selected, setSelected] = useState<SelectedComponents>({});
  const [components, setComponents] = useState<ComponentsData>({});
  const [viewMode, setViewMode] = useState<'full' | 'short'>('full');

  useEffect(() => {
    axios.get('http://localhost:8000/components')
      .then(res => setComponents(res.data));
  }, []);

  return (
    <Container maxWidth="md" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Card sx={{ p: 4, minWidth: 400, maxWidth: 600, boxShadow: 6, borderRadius: 4 }}>
          <Typography variant="h3" align="center" color="primary" gutterBottom fontWeight={700}>
            Конфигуратор ПК
          </Typography>
          <Divider sx={{ my: 2 }} />
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, val) => val && setViewMode(val)}
            sx={{ mb: 2 }}
          >
            <ToggleButton value="full">Полная</ToggleButton>
            <ToggleButton value="short">Краткая</ToggleButton>
          </ToggleButtonGroup>
          <Button variant="outlined" color="secondary" sx={{ mb: 2 }} onClick={() => setSelected({})}>
            Очистить всё
          </Button>
          <PresetSelector onSelect={setSelected} />
          <Divider sx={{ my: 2 }} />
          <ComponentSelector selected={selected} setSelected={setSelected} viewMode={viewMode} />
          <Divider sx={{ my: 2 }} />
          <BuildSummary selected={selected} components={components} />
        </Card>
      </Box>
    </Container>
  );
};

export default App; 