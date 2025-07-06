import { Box } from '@mui/material';
import React, { useContext } from 'react';
import { List, ListItem,  ListItemButton, ListItemText, Typography } from '@mui/material';
import { GlobalContext } from '../utils/GlobalContext';
import { useTheme } from '@mui/material/styles';


function CategoryList() {
  const  globalData  = useContext(GlobalContext);
  const sortedCategories = Object.entries(globalData.data.categories).sort(([a], [b]) => a.localeCompare(b));
  return (
    <List>
      <ListItem sx={{padding: 0}}> 
        <ListItemText 
          primary={<Typography variant="h5">Categories</Typography>} 
          disableTypography
        />
      </ListItem>
      {
          sortedCategories.map(([category, count]) => ( 
          <a href={`/category/${category}.html`} key={category}>
            <ListItemButton  sx={{padding: 0, marginLeft: "5px", height: "1.5em"}}> 
              <ListItemText 
                primary={`${category} (${count})`}
                primaryTypographyProps={{variant: "sidebarLink"}}
              />
            </ListItemButton>
          </a> 
        ))
      }    
    </List>
  );
}

function TagList() {
  const globalData = useContext(GlobalContext);
  const sortedTags = Object.entries(globalData.data.tags).sort(([a], [b]) => a.localeCompare(b));
  const theme = useTheme();

  return (
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
      gap: '1px', 
      marginTop: "10px", 
    }}>
      <Box sx={{ gridColumn: 'span 3' }}>
        <Typography variant="h5">Tags</Typography>
      </Box>
      {
        sortedTags.map(([tag, count]) => (
          <Box key={tag} sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: theme.palette.headerGrey,
            minHeight: '1.5em'
          }}>
            <a href={`/tag/${tag}.html`} style={{ textDecoration: 'none' }}>
              <ListItemButton sx={{ padding: 0, marginLeft: '2px', height: 'auto'  }}>
                <ListItemText
                  primary={tag}
                  primaryTypographyProps={{ variant: 'sidebarLink' }}
                />
              </ListItemButton>
            </a>
          </Box>
        ))
      }
    </Box>
  );
}

function BlogSidebar(sx) {
  return (
    <Box sx={{
      width: 300,
      padding: '20px',
      ...sx
    }}>
      <CategoryList />
      <TagList />
    </Box>
  );
}

export default BlogSidebar;