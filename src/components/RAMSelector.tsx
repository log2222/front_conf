import React, { useState, useEffect } from 'react';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Typography,
  Alert,
  Card,
  CardContent,
  IconButton,
  TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

// Функция для анализа названия комплекта памяти и определения количества модулей
const analyzeRamKit = (ramName: string): number => {
  if (!ramName) return 1;
  
  // Паттерны для поиска количества модулей в комплекте
  const patterns = [
    // 2x4Gb, 4x8Gb, 2x16Gb и т.д.
    /(\d+)x(\d+)gb/i,
    // 2x4G, 4x8G, 2x16G и т.д.
    /(\d+)x(\d+)g/i,
    // 2x4, 4x8, 2x16 и т.д. (если после этого идет Gb/G)
    /(\d+)x(\d+)(?=\s*[gG])/i,
  ];
  
  for (const pattern of patterns) {
    const match = ramName.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  // Если паттерн не найден, предполагаем 1 модуль
  return 1;
};

interface ComponentOption {
  name: string;
  price: number;
  ram_type?: string;
  ram_slots?: number;
  modules_in_kit?: number;
  capacity_gb?: number;
  capacity_raw?: string;
  code?: string;
  article?: string;
}

interface SelectedRAM {
  name: string;
  quantity: number;
}

type SortType = 'default' | 'price' | 'name' | 'capacity';

interface Props {
  selected: string[];
  setSelected: (selected: string[]) => void;
  viewMode: 'full' | 'short';
  selectedMotherboard?: string;
  components: { [category: string]: ComponentOption[] };
  sortType?: SortType; // Тип сортировки
}

const RAMSelector: React.FC<Props> = ({ 
  selected, 
  setSelected, 
  viewMode, 
  selectedMotherboard,
  components,
  sortType = 'default'
}) => {
  const [ramType, setRamType] = useState<string>('');
  const [compatibilityError, setCompatibilityError] = useState<string>('');
  const [selectedRAM, setSelectedRAM] = useState<SelectedRAM[]>([]);

  // Получаем объект выбранной материнской платы и максимальное количество слотов
  const selectedMotherboardObj = components['Motherboard']?.find(
    mb => mb.name === selectedMotherboard
  );
  const maxSlots = selectedMotherboardObj?.ram_slots || 2;

  // Считаем общее количество модулей RAM с учетом комплектов
  const getTotalModules = (selectedArr: string[]) => {
    const counts: { [key: string]: number } = {};
    selectedArr.forEach(name => {
      counts[name] = (counts[name] || 0) + 1;
    });
    let sum = 0;
    Object.entries(counts).forEach(([name, kits]) => {
      const ramOption = components['RAM']?.find(r => r.name === name);
      // Используем analyzeRamKit если modules_in_kit не заполнено
      const modulesInKit = ramOption?.modules_in_kit || analyzeRamKit(ramOption?.name || '');
      sum += kits * modulesInKit;
    });
    return sum;
  };

  useEffect(() => {
    if (selectedMotherboard && components['Motherboard']) {
      const motherboard = components['Motherboard'].find(mb => mb.name === selectedMotherboard);
      if (motherboard) {
        setRamType(motherboard.ram_type || '');
      }
    }
  }, [selectedMotherboard, components]);

  // Синхронизируем selected с selectedRAM
  useEffect(() => {
    const ramItems: SelectedRAM[] = [];
    const counts: { [key: string]: number } = {};
    
    selected.forEach(name => {
      counts[name] = (counts[name] || 0) + 1;
    });
    
    Object.entries(counts).forEach(([name, quantity]) => {
      ramItems.push({ name, quantity });
    });
    
    setSelectedRAM(ramItems);
  }, [selected]);

  // Функция сортировки RAM
  const sortRAMOptions = (options: ComponentOption[]): ComponentOption[] => {
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

  const handleAddRAM = (ramName: string) => {
    if (ramName) {
      const ramOption = components['RAM']?.find(r => r.name === ramName);
      // Используем analyzeRamKit если modules_in_kit не заполнено
      const modulesInKit = ramOption?.modules_in_kit || analyzeRamKit(ramOption?.name || '');
      // Проверяем лимит слотов
      if (getTotalModules(selected) + modulesInKit > maxSlots) {
        setCompatibilityError(`Превышено количество слотов памяти на материнской плате (${maxSlots})`);
        return;
      }
      // Проверяем совместимость типа памяти
      if (ramOption && ramType && ramOption.ram_type !== ramType) {
        setCompatibilityError(`Несовместимость: материнская плата поддерживает ${ramType}, а модуль ${ramOption.ram_type}`);
        return;
      }
      // Проверяем совместимость SO-DIMM/DIMM
      if (selectedMotherboard && ramOption) {
        const motherboard = components['Motherboard']?.find(mb => mb.name === selectedMotherboard);
        if (motherboard) {
          const isSodimmMotherboard = /so-?dimm|sodimm/i.test(motherboard.name);
          const isSodimmRAM = /so-?dimm|sodimm/i.test(ramOption.name);
          if (isSodimmMotherboard !== isSodimmRAM) {
            const motherboardType = isSodimmMotherboard ? 'SO-DIMM' : 'DIMM';
            const ramType = isSodimmRAM ? 'SO-DIMM' : 'DIMM';
            setCompatibilityError(`Несовместимость: материнская плата поддерживает ${motherboardType}, а модуль ${ramType}`);
            return;
          }
        }
      }
      setCompatibilityError('');
      setSelected([...selected, ramName]);
    }
  };

  const handleQuantityChange = (ramName: string, newKits: number) => {
    const ramOption = components['RAM']?.find(r => r.name === ramName);
    // Используем analyzeRamKit если modules_in_kit не заполнено
    const modulesInKit = ramOption?.modules_in_kit || analyzeRamKit(ramOption?.name || '');
    const counts: { [key: string]: number } = {};
    selected.forEach(name => {
      counts[name] = (counts[name] || 0) + 1;
    });
    // Суммируем модули других комплектов
    let otherModules = 0;
    Object.entries(counts).forEach(([name, kits]) => {
      if (name !== ramName) {
        const ropt = components['RAM']?.find(r => r.name === name);
        // Используем analyzeRamKit если modules_in_kit не заполнено
        const mkit = ropt?.modules_in_kit || analyzeRamKit(ropt?.name || '');
        otherModules += kits * mkit;
      }
    });
    const newModules = newKits * modulesInKit;
    if (newKits < 0) return;
    if (otherModules + newModules > maxSlots) {
      setCompatibilityError(`Превышено количество слотов памяти на материнской плате (${maxSlots})`);
      return;
    }
    setCompatibilityError('');
    // Удаляем все старые модули этого комплекта и добавляем нужное количество комплектов
    let newSelected = selected.filter(name => name !== ramName);
    newSelected = [...newSelected, ...Array(newKits).fill(ramName)];
    setSelected(newSelected);
  };

  const getFilteredRAM = () => {
    if (!components['RAM']) return [];
    
    let filtered = components['RAM'];
    
    // Фильтруем по типу памяти материнской платы
    if (ramType) {
      filtered = filtered.filter(ram => ram.ram_type === ramType);
    }
    
    // Фильтруем по совместимости SO-DIMM/DIMM
    if (selectedMotherboard) {
      const motherboard = components['Motherboard']?.find(mb => mb.name === selectedMotherboard);
      if (motherboard) {
        // Проверяем, поддерживает ли мат. плата SO-DIMM
        const isSodimmMotherboard = /so-?dimm|sodimm/i.test(motherboard.name);
        
        filtered = filtered.filter(ram => {
          // Проверяем, является ли память SO-DIMM
          const isSodimmRAM = /so-?dimm|sodimm/i.test(ram.name);
          return isSodimmMotherboard === isSodimmRAM;
        });
      }
    }
    
    return sortRAMOptions(filtered);
  };

  const getTotalPrice = () => {
    // Группируем по названиям для учета комплектов
    const groupedRAM: { [key: string]: number } = {};
    selected.forEach(ramName => {
      groupedRAM[ramName] = (groupedRAM[ramName] || 0) + 1;
    });
    
    return Object.entries(groupedRAM).reduce((total, [ramName, count]) => {
      const ram = components['RAM']?.find(opt => opt.name === ramName);
      // Используем analyzeRamKit если modules_in_kit не заполнено
      const modulesInKit = ram?.modules_in_kit || analyzeRamKit(ram?.name || '');
      const kitsNeeded = Math.ceil(count / modulesInKit);
      return total + (ram?.price || 0) * kitsNeeded;
    }, 0);
  };

  if (viewMode === 'short') {
    return (
      <Box>
        <Typography variant="body1" color="text.secondary">
          Краткий список (формат будет добавлен позже)
        </Typography>
      </Box>
    );
  }

  const filteredRAM = getFilteredRAM();

  return (
    <Box>
      {/* {selectedMotherboard && (
        <Typography variant="caption" display="block" color="text.secondary" gutterBottom>
          Материнская плата: {selectedMotherboard} ({maxSlots} слота{maxSlots > 1 ? 'ов' : ''})
          {ramType && `, поддерживает ${ramType}`}
        </Typography>
      )} */}
      
      {compatibilityError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {compatibilityError}
        </Alert>
      )}

      {/* Выбранные модули RAM */}
      {selected.length > 0 && (
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Выбранные модули RAM ({selectedRAM.reduce((sum, item) => {
              const ram = components['RAM']?.find(opt => opt.name === item.name);
              const modulesInKit = ram?.modules_in_kit || analyzeRamKit(ram?.name || '');
              return sum + modulesInKit * item.quantity;
            }, 0)}/{maxSlots}):
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            {selectedRAM.map((item, index) => {
              const ram = components['RAM']?.find(opt => opt.name === item.name);
              // Определяем реальное количество комплектов этого типа
              const kitsCount = selected.filter(name => name === item.name).length;
              return (
                <Card key={index} variant="outlined">
                  <CardContent sx={{ py: 1, px: 2 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box flex={1}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {ram?.ram_type} • {ram?.price} ₽ за модуль
                          {ram?.capacity_raw && ` • ${ram.capacity_raw}`}
                          {(ram?.modules_in_kit || analyzeRamKit(ram?.name || '')) > 1 && ` • ${ram?.modules_in_kit || analyzeRamKit(ram?.name || '')} модуля в комплекте`}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <TextField
                          type="number"
                          size="small"
                          label="Кол-во"
                          value={kitsCount}
                          onChange={(e) => {
                            const newKits = parseInt(e.target.value) || 0;
                            handleQuantityChange(item.name, newKits);
                          }}
                          inputProps={{ 
                            min: 0, 
                            max: Math.floor((maxSlots - (selected.length - item.quantity)) / (ram?.modules_in_kit || analyzeRamKit(ram?.name || '') || 1))
                          }}
                          sx={{ width: 80 }}
                        />
                        <IconButton 
                          size="small" 
                          onClick={() => handleQuantityChange(item.name, 0)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Добавление нового модуля RAM */}
      {selected.length < maxSlots && (
        <FormControl fullWidth margin="normal">
          <InputLabel>RAM</InputLabel>
          <Select
            value=""
            label="RAM"
            onChange={(e) => handleAddRAM(e.target.value as string)}
          >
            <MenuItem value="">Выберите модуль RAM</MenuItem>
            {filteredRAM.map(opt => {
              const modulesInKit = opt.modules_in_kit || analyzeRamKit(opt.name);
              const kitInfo = modulesInKit > 1 ? ` (${modulesInKit} модуля в комплекте)` : '';
              return (
                <MenuItem value={opt.name} key={opt.name}>
                  {opt.name} ({opt.price} ₽) - {opt.ram_type}
                  {opt.capacity_raw && ` • ${opt.capacity_raw}`}
                  {kitInfo}
                </MenuItem>
              );
            })}
          </Select>
        </FormControl>
      )}
      
      {/* Общая стоимость */}
      {selected.length > 0 && (
        <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
          <Typography variant="subtitle1">
            Общая стоимость RAM: {getTotalPrice()} ₽
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default RAMSelector;