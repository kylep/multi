import { Box } from '@mui/material';
import React from 'react';

function PaddedRow({ children }) {
  return (
    <Box sx={{ 
      display: 'flex',
      pl: '2%',
      pr: '2%' ,
      '@media (min-width:600px)': { pl: '3%', pr: '3%' },
      '@media (min-width:900px)': { pl: '6%', pr: '6%' },
      '@media (min-width:1200px)': { pl: '9%', pr: '9%' },
    }}>
        {children}
    </Box>
  );
}

export default PaddedRow;