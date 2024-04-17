import React from 'react';
import Typography from '@mui/material/Typography';
import PaddedRow from './PaddedRow';

function SiteTitle() {
  return (
    <PaddedRow data-testid="SiteTitle" sx={{ 
      display: 'flex',
      flexDirection: 'column',
      flexWrap: 'wrap',
      width: '100%', 
      height: "200px",
      backgroundColor: "#EEEEEE",
    }}>
      <Typography variant="h1" component="h1" sx={{
          width: '100%', 
          paddingTop: '50px',
        }}> 
        Kyle Pericak
      </Typography>
      <Typography variant="h3" component="h3" sx={{ 
        width: '100%',
      }}>
      &quot;It works in my environment&quot;
      </Typography>
    </PaddedRow>
  );
}

export default SiteTitle;