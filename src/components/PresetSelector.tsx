import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Button, Typography, Stack } from '@mui/material';

interface Preset {
  name: string;
  components: { [category: string]: string | string[] };
}

interface Props {
  onSelect: (components: { [category: string]: string | string[] }) => void;
}

const PresetSelector: React.FC<Props> = ({ onSelect }) => {
  const [presets, setPresets] = useState<Preset[]>([]);

  useEffect(() => {
    axios.get('https://bconf.onrender.com/presets')
      .then(res => {
        // Корректно приводим SSD и RAM к массиву, если это не массив
        const processedPresets = res.data.map((preset: any) => ({
          ...preset,
          components: {
            ...preset.components,
            'SSD': Array.isArray(preset.components['SSD']) ? preset.components['SSD'] : (preset.components['SSD'] ? [preset.components['SSD']] : []),
            'RAM': Array.isArray(preset.components['RAM']) ? preset.components['RAM'] : (preset.components['RAM'] ? [preset.components['RAM']] : [])
          }
        }));
        setPresets(processedPresets);
      });
  }, []);

  return (
    <Box mb={2}>
      <Typography variant="h6" gutterBottom fontWeight={600} color="primary.dark">Типовые конфигурации</Typography>
      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        {presets.map((preset, index) => (
          <Button
            key={index}
            variant="outlined"
            onClick={() => onSelect(preset.components)}
            sx={{ minWidth: 120 }}
          >
            {preset.name}
          </Button>
        ))}
      </Stack>
    </Box>
  );
};

export default PresetSelector; 
