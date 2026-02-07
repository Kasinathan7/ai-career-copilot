import React from 'react';
import { Box, Typography } from '@mui/material';

const TestComponent = () => {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4">Test Component Working!</Typography>
      <Typography>If you see this, the app is loading correctly.</Typography>
    </Box>
  );
};

export default TestComponent;