import React from 'react';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import HomeIcon from '@mui/icons-material/Home';
import { Link } from '@mui/material';
import { Box } from '@mui/material';
import BlogSidebar from './BlogSidebar';


// spacing to make the header responsive
function ResponsiveRow({ children, sx }) {
  return (
    <Box sx={{ 
      display: 'flex',
      pl: '2%',
      pr: '2%' ,
      '@media (min-width:600px)': { pl: '3%', pr: '3%' },
      '@media (min-width:900px)': { pl: '6%', pr: '6%' },
      '@media (min-width:1200px)': { pl: '9%', pr: '9%' },
      ...sx,
    }}>
        {children}
    </Box>
  );
}

// The grey title bar below the nav bar
function SiteTitle() {
  return (
    <ResponsiveRow data-testid="SiteTitle" sx={{ 
      display: 'flex',
      flexDirection: 'column',
      flexWrap: 'wrap',
      width: '100%', 
      height: "200px",
      backgroundColor: "#EEEEEE",
    }}>
      <Typography variant="titleHeaderH1" component="h1" sx={{
          width: '100%', 
          paddingTop: '30px',
        }}> 
        Kyle Pericak
      </Typography>
      <Typography variant="titleHeaderH3" component="h3" sx={{ 
        width: '100%',
      }}>
      &quot;It works in my environment&quot;
      </Typography>
    </ResponsiveRow>
  );
}

// The text links along the top of the page
function HeaderNavLink({ href, children, sx }) {
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

// Wrapper for the entire footer
function SiteNavHeader() {
  return (
    <AppBar position="static" data-testid="Nav-AppBar" sx={{backgroundColor: 'white' }}>
      <Toolbar disableGutters variant="dense" data-testid="Nav-Toolbar" >
        <ResponsiveRow data-testid="Nav-ResponsiveRow">
          <HeaderNavLink href="/" data-testid="Nav-Link-Home" sx={{marginLeft: 0}}><HomeIcon /></HeaderNavLink>
          <HeaderNavLink href="/index1.html" data-testid="Nav-Link-Archive">Archive</HeaderNavLink>
          <HeaderNavLink href="/about.html" data-testid="Nav-Link-About">About</HeaderNavLink>
        </ResponsiveRow>
      </Toolbar>
    </AppBar>
  );
}

function SiteFooter() {
  return (
    <ResponsiveRow sx={{ 
        width: '100%', 
        backgroundColor: (theme) => theme.palette.grey.main,
      }}>
      <Typography variant="body1" sx={{marginLeft: "20px"}}>
        Last updated 2024-02-05 by Kyle Pericak
      </Typography>
    </ResponsiveRow>
  );
}



// This is the main container that all pages are expected to be wrapped in
function SiteLayout({ children }) {
  return (
    <box suppressHydrationWarning>
      <SiteNavHeader />
      <SiteTitle />
      <ResponsiveRow>
        <Box sx={{width: 'calc(100% - 200px)', padding: '20px', }}>
          {children}
        </Box>
        <BlogSidebar/>
      </ResponsiveRow>
      <SiteFooter></SiteFooter>
    </box>
  );
}

export default SiteLayout;
