import { Box } from '@mui/material';
import React from 'react';

function BlogPostRow({ children, sx }) {
  return (
    <Box sx={{
      width: 'calc(100% - 200px)',
      padding: '20px',
      border: '1px solid black',
      ...sx
    }}>
      {children}
    </Box>
  );
}

export default BlogPostRow;