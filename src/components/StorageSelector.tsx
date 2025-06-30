import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Box, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  Typography, 
  Chip, 
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { API_ENDPOINTS } from '../config';

interface StorageOption {
  name: string;
  price: number;
  type: string;
  capacity_gb?: number;
  capacity_raw?: string;
  code?: string;
  article?: string;
}

interface SelectedStorage {
  name: string;
  quantity: number;
}

type SortType = 'default' | 'price' | 'name' | 'capacity';

interface Props {
  selected: string[];
  setSelected: (selected: string[]) => void;
  viewMode: 'full' | 'short';
  category: string; // Название категории (SSD или HDD)
  sortType?: SortType; // Тип сортировки
}

const StorageSelector: React.FC<Props> = ({ selected, setSelected, viewMode, category, sortType = 'default' }) => {
  const [storageOptions, setStorageOptions] = useState<StorageOption[]>([]);
  const [selectedStorage, setSelectedStorage] = useState<SelectedStorage[]>([]);

  useEffect(() => {
    axios.get(API_ENDPOINTS.components)
      .then(res => {
        const storageData = res.data[category] || [];
        setStorageOptions(storageData);
      });
  }, [category]);

  useEffect(() => {
    const storageItems: SelectedStorage[] = [];
    const counts: { [key: string]: number } = {};
    
    selected.forEach(name => {
      counts[name] = (counts[name] || 0) + 1;
    });
    
    Object.entries(counts).forEach(([name, quantity]) => {
      storageItems.push({ name, quantity });
    });
    
    setSelectedStorage(storageItems);
  }, [selected]);

  // Функция сортировки накопителей
  const sortStorageOptions = (options: StorageOption[]): StorageOption[] => {
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

  const handleAddStorage = (storageName: string) => {
    if (selected.length < 4 && storageName) {
      setSelected([...selected, storageName]);
    }
  };

  const handleQuantityChange = (storageName: string, newQuantity: number) => {
      const handleQuantityChange = (storageName: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      const newSelected = selected.filter(name => name !== storageName);
      setSelected(newSelected);
    } else {
      const currentCount = selected.filter(name => name === storageName).length;
      const difference = newQuantity - currentCount;
      
      let newSelected = [...selected];
      
      if (difference > 0) {
        for (let i = 0; i < difference; i++) {
          if (newSelected.length < 4) {
            newSelected.push(storageName);
          }
        }
      } else if (difference < 0) {
        const toRemove = Math.abs(difference);
        let removed = 0;
        newSelected = newSelected.filter(name => {
          if (name === storageName && removed < toRemove) {
            removed++;
            return false;
          }
          return true;
        });
      }
      
      setSelected(newSelected);
    }
  };

  const getTotalPrice = () => {
    return selected.reduce((total, storageName) => {
      const storage = storageOptions.find(opt => opt.name === storageName);
      return total + (storage?.price || 0);
    }, 0);
  };

  if (viewMode === 'short') {
    return (
      <Box>
        <Typography variant="body1" color="text.secondary">
          Выбрано {category}: {selected.length}/4
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Выбранные накопители */}
      {selected.length > 0 && (
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Выбранные накопители ({selected.length}/4):
          </Typography>
          <Box display="flex" flexDirection="column" gap={1}>
            {selectedStorage.map((item, index) => {
              const storage = storageOptions.find(opt => opt.name === item.name);
              const maxQuantity = 4 - selected.length + item.quantity;
              
              return (
                <Card key={index} variant="outlined">
                  <CardContent sx={{ py: 1, px: 2 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box flex={1}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {storage?.type} • {storage?.price} ₽ за накопитель
                          {storage?.capacity_raw && ` • ${storage.capacity_raw}`}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <TextField
                          type="number"
                          size="small"
                          label="Кол-во"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQuantity = parseInt(e.target.value) || 0;
                            handleQuantityChange(item.name, newQuantity);
                          }}
                          inputProps={{ 
                            min: 0, 
                            max: maxQuantity,
                            style: { width: 60 }
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

      {/* Добавление нового накопителя */}
      {selected.length < 4 && (
        <FormControl fullWidth margin="normal">
          <InputLabel>SSD</InputLabel>
          <Select
            value=""
            label="SSD"
            onChange={(e) => handleAddStorage(e.target.value as string)}
          >
            <MenuItem value="">Выберите накопитель</MenuItem>
            {sortStorageOptions(storageOptions).map(opt => (
              <MenuItem value={opt.name} key={opt.name}>
                {opt.name} ({opt.price} ₽)
                {opt.capacity_raw && ` • ${opt.capacity_raw}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Общая стоимость */}
      {selected.length > 0 && (
        <Box mt={2} p={2} bgcolor="grey.100" borderRadius={1}>
          <Typography variant="subtitle1">
            Общая стоимость {category}: {getTotalPrice()} ₽
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StorageSelector;
