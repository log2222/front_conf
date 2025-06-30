import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, FormControl, InputLabel, MenuItem, Select, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import StorageSelector from './StorageSelector';
import RAMSelector from './RAMSelector';

interface ComponentOption {
  name: string;
  price: number;
  socket?: string;
  ram_type?: string;
  ram_slots?: number;
  power?: number;
  capacity_gb?: number;
  code?: string;
  article?: string;
}

interface ComponentsData {
  [category: string]: ComponentOption[];
}

interface SelectedComponents {
  [category: string]: string | string[];
}

type SortType = 'default' | 'price' | 'name' | 'capacity';

interface Props {
  selected: SelectedComponents;
  setSelected: (selected: SelectedComponents) => void;
  viewMode: 'full' | 'short';
}

const ComponentSelector: React.FC<Props> = ({ selected, setSelected, viewMode }) => {
  const [components, setComponents] = useState<ComponentsData>({});
  const [sortType, setSortType] = useState<SortType>('default');

  useEffect(() => {
    axios.get('http://localhost:8000/components')
      .then(res => setComponents(res.data));
  }, []);

  const handleChange = (category: string, value: string) => {
    // Если выбираем материнскую плату с интегрированным CPU, сбрасываем выбранный CPU
    if (category === 'Motherboard') {
      const mb = components['Motherboard']?.find(opt => opt.name === value);
      if (mb && (mb as any).integrated_cpu) {
        setSelected({ ...selected, [category]: value, CPU: '' });
        return;
      }
    }
    setSelected({ ...selected, [category]: value });
  };

  const handleStorageChange = (storageSelected: string[]) => {
    setSelected({ ...selected, 'SSD': storageSelected });
  };

  const handleRAMChange = (ramSelected: string[]) => {
    setSelected({ ...selected, 'RAM': ramSelected });
  };

  // Функция сортировки компонентов
  const sortOptions = (options: ComponentOption[]): ComponentOption[] => {
    const sortedOptions = [...options];
    
    switch (sortType) {
      case 'price':
        return sortedOptions.sort((a, b) => a.price - b.price);
      case 'name':
        return sortedOptions.sort((a, b) => a.name.localeCompare(b.name));
      case 'capacity':
        return sortedOptions.sort((a, b) => (a.capacity_gb || 0) - (b.capacity_gb || 0));
      case 'default':
      default:
        return sortedOptions; // Оставляем как есть (порядок из файла)
    }
  };

  // Проверка: выбран ли корпус с предустановленным блоком питания
  const selectedCase = components['Case']?.find(opt => opt.name === selected['Case']);
  const caseHasPower = selectedCase && typeof selectedCase.power === 'number' && selectedCase.power > 0;

  // Проверка: выбрана ли мат. плата с интегрированным процессором
  const selectedMotherboard = components['Motherboard']?.find(opt => opt.name === selected['Motherboard']);
  const motherboardHasCPU = selectedMotherboard && (selectedMotherboard as any).integrated_cpu;

  // --- Фильтрация совместимости и материнских плат ---
  const getFilteredOptions = (category: string, options: ComponentOption[]) => {
    if (category === 'Motherboard') {
      // Фильтруем только те, что начинаются с 'Материнская плата' или 'Мат. плата' (без учёта регистра)
      options = options.filter(opt =>
        /^мат(еринская)?\.? плата/i.test(opt.name.trim())
      );
    }
    if (category === 'PSU') {
      // Фильтруем только те блоки питания, что начинаются со слов "Блок питания"
      options = options.filter(opt =>
        opt.name.startsWith("Блок питания")
      );
    }
    if (category === 'Motherboard' && selected['CPU']) {
      // Фильтруем мат. платы по сокету выбранного процессора
      const cpu = components['CPU']?.find(opt => opt.name === selected['CPU']);
      if (cpu && cpu.socket) {
        return sortOptions(options.filter(opt => opt.socket === cpu.socket));
      }
    }
    if (category === 'CPU' && selected['Motherboard']) {
      // Фильтруем процессоры по сокету выбранной мат. платы
      const mb = components['Motherboard']?.find(opt => opt.name === selected['Motherboard']);
      if (mb && mb.socket) {
        return sortOptions(options.filter(opt => opt.socket === mb.socket));
      }
    }
    if (category === 'RAM' && selected['Motherboard']) {
      // Фильтруем память по типу памяти выбранной мат. платы
      const mb = components['Motherboard']?.find(opt => opt.name === selected['Motherboard']);
      if (mb && mb.ram_type) {
        // Проверяем, поддерживает ли мат. плата SO-DIMM
        const isSodimmMotherboard = /so-?dimm|sodimm/i.test(mb.name);
        
        const filtered = options.filter(opt => {
          // Сначала проверяем тип памяти (DDR3, DDR4, DDR5)
          if (opt.ram_type !== mb.ram_type) {
            return false;
          }
          
          // Затем проверяем совместимость SO-DIMM/DIMM
          const isSodimmRAM = /so-?dimm|sodimm/i.test(opt.name);
          
          // Если мат. плата поддерживает SO-DIMM, показываем только SO-DIMM память
          // Если мат. плата не поддерживает SO-DIMM, показываем только обычную DIMM память
          return isSodimmMotherboard === isSodimmRAM;
        });
        return sortOptions(filtered);
      }
    }
    if (category === 'Motherboard' && selected['RAM']) {
      // Фильтруем мат. платы по типу памяти выбранной памяти
      const ram = components['RAM']?.find(opt => opt.name === selected['RAM']);
      if (ram && ram.ram_type) {
        // Проверяем, является ли выбранная память SO-DIMM
        const isSodimmRAM = /so-?dimm|sodimm/i.test(ram.name);
        
        const filtered = options.filter(opt => {
          // Сначала проверяем тип памяти (DDR3, DDR4, DDR5)
          if (opt.ram_type !== ram.ram_type) {
            return false;
          }
          
          // Затем проверяем совместимость SO-DIMM/DIMM
          const isSodimmMotherboard = /so-?dimm|sodimm/i.test(opt.name);
          
          // Если память SO-DIMM, показываем только мат. платы с SO-DIMM
          // Если память обычная DIMM, показываем только мат. платы без SO-DIMM
          return isSodimmRAM === isSodimmMotherboard;
        });
        return sortOptions(filtered);
      }
    }
    return sortOptions(options);
  };

  // Определяем порядок отображения компонентов
  const componentOrder = ['CPU', 'Motherboard', 'RAM', 'SSD', 'GPU', 'Case', 'PSU'];

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
      
      {/* Селектор сортировки */}
      <Box mb={2}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Сортировка:
        </Typography>
        <ToggleButtonGroup
          value={sortType}
          exclusive
          onChange={(e, newSortType) => {
            if (newSortType !== null) {
              setSortType(newSortType);
            }
          }}
          size="small"
        >
          <ToggleButton value="default">По умолчанию</ToggleButton>
          <ToggleButton value="price">По цене</ToggleButton>
          <ToggleButton value="name">По названию</ToggleButton>
          <ToggleButton value="capacity">По объему</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {componentOrder.map(category => {
        const options = components[category];
        if (!options) return null;

        // Специальная обработка для накопителей
        if (category === 'SSD') {
          const storageSelected = Array.isArray(selected[category]) 
            ? selected[category] as string[] 
            : [];
          return (
            <StorageSelector
              key={category}
              selected={storageSelected}
              setSelected={handleStorageChange}
              viewMode={viewMode}
              category="SSD"
              sortType={sortType}
            />
          );
        }

        if (category === 'RAM') {
          const ramSelected = Array.isArray(selected[category]) 
            ? selected[category] as string[] 
            : [];
          return (
            <RAMSelector
              key={category}
              selected={ramSelected}
              setSelected={handleRAMChange}
              viewMode={viewMode}
              selectedMotherboard={selected['Motherboard'] as string}
              components={components}
              sortType={sortType}
            />
          );
        }

        // Надпись если корпус с блоком питания
        if (category === 'PSU' && caseHasPower) {
          return (
            <Box key={category} mb={2}>
              <Typography color="warning.main" fontWeight={500}>
                В выбранном корпусе уже есть блок питания.
              </Typography>
              <FormControl fullWidth margin="normal" disabled>
                <InputLabel>{category}</InputLabel>
                <Select value="" label={category} disabled>
                  <MenuItem value="">Не выбрано</MenuItem>
                </Select>
              </FormControl>
            </Box>
          );
        }
        // Надпись если мат. плата с CPU
        if (category === 'CPU' && motherboardHasCPU) {
          return (
            <Box key={category} mb={2}>
              <Typography color="warning.main" fontWeight={500}>
                В выбранной материнской плате уже есть процессор.
              </Typography>
              <FormControl fullWidth margin="normal" disabled>
                <InputLabel>{category}</InputLabel>
                <Select value="" label={category} disabled>
                  <MenuItem value="">Не выбрано</MenuItem>
                </Select>
              </FormControl>
            </Box>
          );
        }
        // Обычная обработка для остальных категорий
        return (
          <FormControl fullWidth margin="normal" key={category} disabled={
            (category === 'CPU' && motherboardHasCPU)
            || (category === 'PSU' && caseHasPower)
          }>
            <InputLabel>{category}</InputLabel>
            <Select
              value={typeof selected[category] === 'string' ? selected[category] as string : ''}
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
        );
      })}
    </Box>
  );
};

export default ComponentSelector; 