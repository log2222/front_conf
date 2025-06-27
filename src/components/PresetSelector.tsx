import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Button, Typography, Stack } from '@mui/material';

interface Preset {
  name: string;
  components: { [category: string]: string };
}

interface Props {
  onSelect: (components: { [category: string]: string }) => void;
}

const PresetSelector: React.FC<Props> = ({ onSelect }) => {
  const [presets, setPresets] = useState<Preset[]>([]);

  useEffect(() => {
    axios.get('https://bconf.onrender.com/presets')
      .then(res => setPresets(res.data));
  }, []);

  return (
    <Box mb={2}>
      <Typography variant="h6" gutterBottom fontWeight={600} color="primary.dark">Типовые конфигурации</Typography>
      <Stack direction="row" spacing={2} flexWrap="wrap">
        {presets.map((preset, idx) => (
          <Button
            key={preset.name}
            variant={idx % 2 === 0 ? "contained" : "outlined"}
            color={idx % 3 === 0 ? "primary" : idx % 3 === 1 ? "secondary" : "success"}
            size="large"
            onClick={() => onSelect(preset.components)}
            sx={{ mb: 1, minWidth: 160 }}
          >
            {preset.name}
          </Button>
        ))}
      </Stack>
    </Box>
  );
};

export default PresetSelector; 
