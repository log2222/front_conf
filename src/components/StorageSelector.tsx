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
