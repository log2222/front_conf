import React from 'react';
import { Box, Typography, List, ListItem, ListItemText } from '@mui/material';

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

interface Props {
  selected: SelectedComponents;
  components: ComponentsData;
}

const BuildSummary: React.FC<Props> = ({ selected, components }) => {
  let total = 0;
  const summary = Object.entries(selected).map(([category, name]) => {
    const option = components[category]?.find(opt => opt.name === name);
    if (option) total += option.price;
    return (
      <ListItem key={category}>
        <ListItemText primary={`${category}: ${name}`} secondary={option ? `${option.price} ₽` : ''} />
      </ListItem>
    );
  });

  return (
    <Box mt={4}>
      <Typography variant="h6">Итоговая сборка</Typography>
      <List>{summary}</List>
      <Typography variant="subtitle1">Общая стоимость: {total} ₽</Typography>
    </Box>
  );
};

export default BuildSummary; 