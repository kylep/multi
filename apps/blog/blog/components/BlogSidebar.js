import { Box } from '@mui/material';
import React from 'react';
import { List, ListItem,  ListItemButton, ListItemIcon, ListItemText, Typography } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';


const categories = [
  'cloud',
  'development',
  'gaming',
  'projects',
  'reference pages',
  'systems administration',
];


function SidebarListItem(children, sx) {
  return (
    <ListItem sx={{
        margin: 0, 
        padding: 0,
        ...sx
    }}> 
      {children}  
    </ListItem>
  )
}

function SidebarListItemButton(children, sx, key) {
  return (
    <ListItemButton key={text} sx={{
        margin: 0, 
        padding: 0,
        ...sx
    }}> 
      {children}  
    </ListItemButton>
  )
}

function CategoryList() {
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
      
      {categories.map((text) => (
        <ListItemButton key={text} sx={{padding: 0, marginLeft: "10px"}}> 
          <ListItemIcon sx={{minWidth: "32px"}}>
            <InsertDriveFileIcon />
          </ListItemIcon>
          <ListItemText primary={text} />
        </ListItemButton>
      ))}
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