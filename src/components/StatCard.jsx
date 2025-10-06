// src/components/StatCard.jsx
import React from 'react';
import { Card, Box, Typography, useMediaQuery, useTheme } from '@mui/material';

export default function StatCard({ title, value, icon }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        p: 2,
        height: isMobile ? 'auto' : 120,
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Typography color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h6" component="div">
          {value}
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mt: isMobile ? 1 : 0,
        }}
      >
        {icon}
      </Box>
    </Card>
  );
}
