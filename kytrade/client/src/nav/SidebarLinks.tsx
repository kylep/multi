import React from 'react';
import List from '@mui/material/List';
import {Link} from 'react-router-dom';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import ScienceIcon from '@mui/icons-material/Science';
import TableViewIcon from '@mui/icons-material/TableView';
import HelpIcon from '@mui/icons-material/Help';


export default function SidebarLinks() {
    return (
        <List>        
          <MenuItem component={Link} to={"/experiments"}>
            <ListItem key={"Experiments"} disablePadding>
                <ListItemButton>
                  <ListItemIcon>
                    <ScienceIcon />
                  </ListItemIcon>
                  <ListItemText primary={"Experiments"} />
                </ListItemButton>
              </ListItem>
            </MenuItem>

            <MenuItem component={Link} to={"/screener"}>
              <ListItem key={"Stock Screener"} disablePadding>
                <ListItemButton>
                  <ListItemIcon>
                    <TableViewIcon />
                  </ListItemIcon>
                  <ListItemText primary={"Stock Screener"} />
                </ListItemButton>
              </ListItem>
            </MenuItem>

            <MenuItem component={Link} to={"/about"}>
              <ListItem key={"Help & About"} disablePadding>
                  <ListItemButton>
                    <ListItemIcon>
                      <HelpIcon />
                    </ListItemIcon>
                    <ListItemText primary={"Help & About"} />
                  </ListItemButton>
                </ListItem>   
            </MenuItem>
        </List>        
    )
}