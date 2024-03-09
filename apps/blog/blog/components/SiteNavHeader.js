import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import HomeIcon from '@mui/icons-material/Home';
import { Link } from '@mui/material';
import PaddedRow from './PaddedRow';


function NavLink({ href, children, sx }) {
  return (
    <Link href={href} color="grey" underline="none" variant="body1" sx={{
      ml: 2, 
      alignItems: 'center', 
      paddingTop: '8px',
      ...sx
    }}>
      {children}  
    </Link>
  );
}

function SiteNavHeader() {
  return (
    <AppBar position="static" data-testid="Nav-AppBar" sx={{backgroundColor: 'white' }}>
      <Toolbar disableGutters variant="dense" data-testid="Nav-Toolbar" >
        <PaddedRow data-testid="Nav-PaddedRow">
          <NavLink href="/" data-testid="Nav-Link-Home" sx={{marginLeft: 0}}><HomeIcon /></NavLink>
          <NavLink href="/archive" data-testid="Nav-Link-Archive">Archive</NavLink>
          <NavLink href="/about" data-testid="Nav-Link-About">About</NavLink>
        </PaddedRow>
      </Toolbar>
    </AppBar>
  );
}

export default SiteNavHeader;