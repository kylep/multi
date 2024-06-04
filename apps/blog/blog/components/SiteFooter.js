import React from 'react';
import Typography from '@mui/material/Typography';
import PaddedRow from './PaddedRow';

function SiteFooter() {
  return (
    <PaddedRow sx={{ 
        width: '100%', 
        backgroundColor: (theme) => theme.palette.grey.main,
      }}>
      <Typography variant="body1" sx={{marginLeft: "20px"}}>
        Last updated 2024-02-05 by Kyle Pericak
      </Typography>
    </PaddedRow>
  );
}

export default SiteFooter;