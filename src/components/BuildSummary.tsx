import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Chip, Paper, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

interface ComponentOption {
  name: string;
  price: number;
  code?: string;
  article?: string;
  capacity_gb?: number;
  capacity_raw?: string;
  power?: number;
  memory_size_gb?: number;
  memory_size_raw?: string;
  ProcessorNumber?: string;
}

interface ComponentsData {
  [category: string]: ComponentOption[];
}

interface SelectedComponents {
  [category: string]: string | string[];
}

interface Props {
  selected: SelectedComponents;
  components: ComponentsData;
}

// Удаляет лишние символы из названия CPU (Intel)
function stripIntelMarks(str: string) {
  return str
    .replace(/®/g, '')
    .replace(/™/g, '')
    .replace(/Processor/gi, '')
    .replace(/Процессор/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Обрезает AMD Family до короткого имени
function shortAmdName(str: string) {
  if (!str) return '';
  let result = str.split(/ with | с | с графикой| с видеоядром/i)[0].trim();
  // Убираем слово "Processor" из AMD названий
  result = result.replace(/Processor/gi, '').replace(/\s+/g, ' ').trim();
  return result;
}

// Функция для анализа названия комплекта памяти и определения количества планок
const analyzeRamKit = (ramName: string): { kitCount: number; capacityPerStick: number } => {
  // Паттерны для поиска количества планок в комплекте
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
      const kitCount = parseInt(match[1]);
      const capacityPerStick = parseInt(match[2]);
      return { kitCount, capacityPerStick };
    }
  }
  
  // Если паттерн не найден, ищем просто объем памяти (например, 8Gb, 16Gb)
  const volumePatterns = [
    /(\d+)gb/i,
    /(\d+)g(?=\s|$)/i,
  ];
  
  for (const pattern of volumePatterns) {
    const match = ramName.match(pattern);
    if (match) {
      const capacity = parseInt(match[1]);
      return { kitCount: 1, capacityPerStick: capacity };
    }
  }
  
  // Если ничего не найдено, предполагаем 1 планку
  return { kitCount: 1, capacityPerStick: 0 };
};

const BuildSummary: React.FC<Props> = ({ selected, components }) => {
  let total = 0;
  const summary = Object.entries(selected).map(([category, value]) => {
    if (category === 'SSD' && Array.isArray(value)) {
      // Обработка массива SSD
      const storageItems = value.map((storageName, index) => {
        const option = components[category]?.find(opt => opt.name === storageName);
        if (option) {
          total += option.price;
          return {
            name: storageName,
            price: option.price,
            code: option.code,
            article: option.article,
            capacity_gb: option.capacity_gb,
            capacity_raw: option.capacity_raw
          };
        }
        return { name: storageName, price: 0 };
      });
      return { category: 'SSD', items: storageItems };
    }
    
    if (category === 'RAM' && Array.isArray(value)) {
      // Обработка массива RAM
      const ramItems = value.map((ramName, index) => {
        const option = components[category]?.find(opt => opt.name === ramName);
        if (option) {
          total += option.price;
          return {
            name: ramName,
            price: option.price,
            code: option.code,
            article: option.article,
            capacity_gb: option.capacity_gb,
            capacity_raw: option.capacity_raw
          };
        }
        return { name: ramName, price: 0 };
      });
      return { category: 'RAM', items: ramItems };
    }

    // Обычная обработка для одиночных компонентов
    if (typeof value === 'string' && value) {
      const option = components[category]?.find(opt => opt.name === value);
      if (option) {
        total += option.price;
        return { 
          category, 
          items: [{
            name: value,
            price: option.price,
            code: option.code,
            article: option.article,
            capacity_gb: option.capacity_gb,
            capacity_raw: option.capacity_raw,
            power: option.power,
            memory_size_gb: option.memory_size_gb,
            memory_size_raw: option.memory_size_raw
          }]
        };
      }
      return { category, items: [{ name: value, price: 0 }] };
    }
    
    return null;
  }).filter(Boolean);

  // Функция генерации названия ПК
  const generatePCName = (): string => {
    const parts: string[] = [];
    
    // Проверяем, какие компоненты выбраны
    const hasCPU = summary.find(item => item?.category === 'CPU');
    const hasMotherboard = summary.find(item => item?.category === 'Motherboard');
    const hasRAM = summary.find(item => item?.category === 'RAM');
    const hasGPU = summary.find(item => item?.category === 'GPU');
    const hasSSD = summary.find(item => item?.category === 'SSD');
    const hasPSU = summary.find(item => item?.category === 'PSU');
    const hasCase = summary.find(item => item?.category === 'Case');
    
    // Если выбрана только RAM, показываем только её
    const onlyRAM = hasRAM && !hasCPU && !hasMotherboard && !hasGPU && !hasSSD && !hasPSU && !hasCase;
    
    // CPU
    const cpuItem = summary.find(item => item?.category === 'CPU')?.items[0];
    if (cpuItem && !onlyRAM) {
      const cpuName = cpuItem.name;
      // Найти объект CPU полностью
      const cpuComponent = components.CPU?.find(opt => opt.name === cpuName);
      let label = cpuName;
      if (cpuComponent) {
        const cpuAny = cpuComponent as any;
        if (cpuAny.clean_name) {
          // AMD: фильтруем clean_name, если это AMD
          if (/amd/i.test(cpuAny.clean_name)) {
            label = shortAmdName(cpuAny.clean_name);
          } else {
            label = stripIntelMarks(cpuAny.clean_name);
          }
        } else if (cpuAny.enrichment_data) {
          // AMD: enrichment_data.Family
          if (cpuAny.enrichment_data.Family && /amd/i.test(cpuAny.enrichment_data.Family)) {
            label = shortAmdName(cpuAny.enrichment_data.Family);
          } else if (cpuAny.enrichment_data.CpuName) {
            label = stripIntelMarks(cpuAny.enrichment_data.CpuName);
          }
        }
      }
      parts.push(label);
    }
    
    // Motherboard
    const mbItem = summary.find(item => item?.category === 'Motherboard')?.items[0];
    if (mbItem && !onlyRAM) {
      const mbName = mbItem.name;
      // Извлекаем чипсет (например, "H610", "B660")
      const chipsetMatch = mbName.match(/([A-Z][0-9]{3,4})/);
      if (chipsetMatch) {
        parts.push(chipsetMatch[1]);
      } else {
        // Fallback: берем короткое название
        const fallback = mbName.replace(/^Материнская плата\s*/, '').split(/\s+/).slice(0, 2).join(' ');
        parts.push(fallback);
      }
    }
    
    // RAM - обновленная логика для анализа комплектов памяти
    const ramItems = summary.find(item => item?.category === 'RAM')?.items || [];
    if (ramItems.length > 0) {
      // Группируем по названию и считаем количество каждого комплекта
      const ramCounts: { [name: string]: { count: number, item: any } } = {};
      let detectedRamType = '';
      ramItems.forEach(item => {
        if (!ramCounts[item.name]) ramCounts[item.name] = { count: 0, item };
        ramCounts[item.name].count += 1;
        // Пытаемся определить тип памяти из названия
        if (!detectedRamType) {
          const match = item.name.match(/(DDR\d)/i);
          if (match) detectedRamType = match[1].toUpperCase();
        }
      });
      let totalSticks = 0;
      let stickSize = 0;
      Object.values(ramCounts).forEach(({ count, item }) => {
        const { kitCount, capacityPerStick } = analyzeRamKit(item.name);
        totalSticks += kitCount * count;
        if (capacityPerStick > 0) stickSize = capacityPerStick;
        else if (item.capacity_gb) stickSize = item.capacity_gb;
      });
      const ramType = detectedRamType || 'DDR4';
      if (totalSticks > 0 && stickSize > 0) {
        parts.push(`${ramType} ${totalSticks}x${stickSize}Gb`);
      } else if (totalSticks > 0) {
        parts.push(`${ramType} ${totalSticks}Gb`);
      } else {
        parts.push(ramType);
      }
    }
    
    // GPU
    const gpuItem = summary.find(item => item?.category === 'GPU')?.items[0];
    if (gpuItem && !onlyRAM) {
      const gpuName = gpuItem.name;
      // Найти объект GPU полностью для доступа к clean_name и name_gb
      const gpuComponent = components.GPU?.find(opt => opt.name === gpuName);
      let gpuLabel = gpuName;
      
      if (gpuComponent) {
        const gpuAny = gpuComponent as any;
        if (gpuAny.clean_name && gpuAny.name_gb) {
          // Используем правильный формат: clean_name + name_gb
          gpuLabel = `${gpuAny.clean_name} ${gpuAny.name_gb}`;
        } else if (gpuAny.clean_name) {
          // Если есть только clean_name, добавляем memory_size_gb
          const memoryGB = gpuAny.memory_size_gb;
          if (memoryGB) {
            gpuLabel = `${gpuAny.clean_name} ${memoryGB}Gb`;
          } else {
            gpuLabel = gpuAny.clean_name;
          }
        } else {
          // Fallback: извлекаем модель GPU из полного названия
          const gpuMatch = gpuName.match(/(?:GeForce|Radeon|Quadro)\s+([A-Z0-9\s]+)/i);
          if (gpuMatch) {
            const model = gpuMatch[1].trim();
            const memoryGB = gpuAny.memory_size_gb;
            if (memoryGB) {
              gpuLabel = `${model} ${memoryGB}Gb`;
            } else {
              gpuLabel = model;
            }
          } else {
            // Fallback: берем короткое название
            gpuLabel = gpuName.replace(/^Видеокарта\s*/, '').split(/\s+/).slice(0, 3).join(' ');
          }
        }
      }
      
      parts.push(gpuLabel);
    }
    
    // SSD - обновленная логика для отображения каждого SSD отдельно
    const ssdItems = summary.find(item => item?.category === 'SSD')?.items || [];
    if (ssdItems.length > 0 && !onlyRAM) {
      ssdItems.forEach(ssdItem => {
        const ssdGB = ssdItem.capacity_gb || 0;
        if (ssdGB > 0) {
          parts.push(`SSD ${ssdGB}Gb`);
        } else {
          parts.push('SSD');
        }
      });
    }
    
    // PSU
    const psuItem = summary.find(item => item?.category === 'PSU')?.items[0];
    if (psuItem && !onlyRAM) {
      const power = (psuItem as any).power;
      if (power) {
        parts.push(`${power}W`);
      }
    }
    
    // Case (если есть встроенный блок питания)
    const caseItem = summary.find(item => item?.category === 'Case')?.items[0];
    if (caseItem && (caseItem as any).power && !psuItem && !onlyRAM) {
      parts.push(`${(caseItem as any).power}W`);
    }
    
    return parts.length > 0 ? `Компьютер Micron (${parts.join(', ')})` : 'Компьютер Micron';
  };

  const renderComponentInfo = (item: { name: string; price: number; code?: string; article?: string }) => {
    return (
      <Box>
        <Typography variant="body2">{item.name}</Typography>
        <Box display="flex" gap={1} mt={0.5}>
          <Typography variant="body2" color="text.secondary">
            {item.price} ₽
          </Typography>
          {item.code && (
            <Chip 
              label={`Код: ${item.code}`} 
              size="small" 
              variant="outlined" 
              color="primary"
            />
          )}
          {item.article && (
            <Chip 
              label={`Арт: ${item.article}`} 
              size="small" 
              variant="outlined" 
              color="secondary"
            />
          )}
        </Box>
      </Box>
    );
  };

  const pcName = generatePCName();

  // Функция для генерации TXT файла со сводкой сборки
  const generateTxtContent = (): string => {
    let content = `${pcName}\n\n`;
    content += `Код\tАрт\tНаименование\tКол-во\tЦена\n`;
    
    summary.forEach((item) => {
      if (item) {
        item.items.forEach((component) => {
          const code = component.code || '';
          const article = component.article || '';
          const name = component.name || '';
          const quantity = '1'; // По умолчанию количество 1
          const price = component.price || 0;
          
          content += `${code}\t${article}\t${name}\t${quantity}\t${price}\n`;
        });
      }
    });
    
    content += `\nОбщая стоимость: ${total} ₽\n`;
    return content;
  };

  // Функция для скачивания TXT файла
  const downloadTxtFile = () => {
    const content = generateTxtContent();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const today = new Date().toISOString().split('T')[0];
    link.download = `micronpc_${today}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      {/* Название ПК */}
      {summary.length > 0 && (
        <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h5" fontWeight="bold" color="primary.main">
            {pcName}
          </Typography>
        </Paper>
      )}
      <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Сводка сборки</Typography>
          {summary.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={downloadTxtFile}
              size="small"
            >
              Скачать TXT
            </Button>
          )}
        </Box>
        <List>
          {summary.map((item, index) => (
            <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {item?.category}
              </Typography>
              {item?.items.map((component, compIndex) => (
                <Box key={compIndex} mb={1} width="100%">
                  {renderComponentInfo(component)}
                </Box>
              ))}
            </ListItem>
          ))}
        </List>
        <Box mt={2} p={2} bgcolor="primary.main" color="white" borderRadius={1}>
          <Typography variant="h6">
            Общая стоимость: {total} ₽
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default BuildSummary; 