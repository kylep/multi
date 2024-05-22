import { Box } from '@mui/material';
import React, { useContext } from 'react';
import { List, ListItem,  ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { GlobalContext } from '../utils/GlobalContext';


function CategoryList() {
  const  globalData  = useContext(GlobalContext);

  return (
    <List>
      <ListItem sx={{padding: 0}}> 
        <ListItemIcon sx={{minWidth: "30px"}}>
          <FolderIcon />
        </ListItemIcon>
        <ListItemText 
          primary={<Typography variant="h5">Categories</Typography>} 
          disableTypography
        />
      </ListItem>
      
      {
          Object.entries(globalData.data.categories).map(([category, count]) => ( 
          <ListItemButton key={category} sx={{padding: 0, marginLeft: "10px"}}> 
            <ListItemIcon sx={{minWidth: "32px"}}>
              <InsertDriveFileIcon />
            </ListItemIcon>
            <ListItemText primary={`${category} (${count})`} />
          </ListItemButton>
        ))
      }    
    </List>
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
    </Box>
  );
}

export default BlogSidebar;