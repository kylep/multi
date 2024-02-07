import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import PaddedRow from './PaddedRow';

function SiteTitle() {
  return (
    <PaddedRow sx={{ 
        width: '100%', 
        backgroundColor: (theme) => theme.palette.grey.main,
      }}>
      <Typography variant="h2">
        Kyle Pericak
      </Typography>
      <Typography variant="h6" sx={{ fontStyle: 'italic' }}>
        "It works on my machine"
      </Typography>
    </PaddedRow>
  );
}

export default SiteTitle;