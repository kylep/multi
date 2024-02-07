import React from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import HomeIcon from '@mui/icons-material/Home';
import { Link } from '@mui/material';
import PaddedRow from './PaddedRow';


function NavLink({ href, children }) {
  return (
    <Link href={href} color="inherit" underline="none" variant="body1" sx={{mr: 2}}>
      {children}  
    </Link>
  );
}

function SiteNavHeader() {
  return (
    <AppBar position="static">
      <Toolbar disableGutters>
        <PaddedRow>
          <NavLink href="/"><HomeIcon /></NavLink>
          <NavLink href="/archibe">Archive</NavLink>
          <NavLink href="/about">About</NavLink>
        </PaddedRow>
      </Toolbar>
    </AppBar>
  );
}

export default SiteNavHeader;