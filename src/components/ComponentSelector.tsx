import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';

interface ComponentOption {
  name: string;
  price: number;
  socket?: string;
  ram_type?: string;
}

interface ComponentsData {
  [category: string]: ComponentOption[];
}

interface SelectedComponents {
  [category: string]: string;
}

interface Props {
  selected: SelectedComponents;
  setSelected: (selected: SelectedComponents) => void;
  viewMode: 'full' | 'short';
}

const ComponentSelector: React.FC<Props> = ({ selected, setSelected, viewMode }) => {
  const [components, setComponents] = useState<ComponentsData>({});

  useEffect(() => {
    axios.get('http://localhost:8000/components')
      .then(res => setComponents(res.data));
  }, []);

  const handleChange = (category: string, value: string) => {
    setSelected({ ...selected, [category]: value });
  };

  // --- Фильтрация совместимости ---
  const getFilteredOptions = (category: string, options: ComponentOption[]) => {
    if (category === 'Motherboard' && selected['CPU']) {
      // Фильтруем мат. платы по сокету выбранного процессора
      const cpu = components['CPU']?.find(opt => opt.name === selected['CPU']);
      if (cpu && cpu.socket) {
        return options.filter(opt => opt.socket === cpu.socket);
      }
    }
    if (category === 'CPU' && selected['Motherboard']) {
      // Фильтруем процессоры по сокету выбранной мат. платы
      const mb = components['Motherboard']?.find(opt => opt.name === selected['Motherboard']);
      if (mb && mb.socket) {
        return options.filter(opt => opt.socket === mb.socket);
      }
    }
    if (category === 'RAM' && selected['Motherboard']) {
      // Фильтруем память по типу памяти выбранной мат. платы
      const mb = components['Motherboard']?.find(opt => opt.name === selected['Motherboard']);
      if (mb && mb.ram_type) {
        return options.filter(opt => opt.ram_type === mb.ram_type);
      }
    }
    if (category === 'Motherboard' && selected['RAM']) {
      // Фильтруем мат. платы по типу памяти выбранной памяти
      const ram = components['RAM']?.find(opt => opt.name === selected['RAM']);
      if (ram && ram.ram_type) {
        return options.filter(opt => opt.ram_type === ram.ram_type);
      }
    }
    return options;
  };

  if (viewMode === 'short') {
    return (
      <Box>
        <Typography variant="body1" color="text.secondary">Краткий список (формат будет добавлен позже)</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Выберите комплектующие</Typography>
      {Object.entries(components).map(([category, options]) => (
        <FormControl fullWidth margin="normal" key={category}>
          <InputLabel>{category}</InputLabel>
          <Select
            value={selected[category] || ''}
            label={category}
            onChange={e => handleChange(category, e.target.value as string)}
          >
            <MenuItem value="">Не выбрано</MenuItem>
            {getFilteredOptions(category, options).map(opt => (
              <MenuItem value={opt.name} key={opt.name}>
                {opt.name} ({opt.price} ₽)
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ))}
    </Box>
  );
};

export default ComponentSelector; 