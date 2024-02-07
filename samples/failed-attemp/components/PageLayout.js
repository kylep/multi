import React from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { createTheme, ThemeProvider } from '@mui/material/styles';




const MainContent = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(3),
    alignItems: 'flex-start',
}));


const NavBar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton edge="start" color="inherit" aria-label="menu">
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" style={{ flexGrow: 1 }}>
          Blog
        </Typography>
        <Button color="inherit">Login</Button>
      </Toolbar>
    </AppBar>
  );
};

const PageLayout = ({ children }) => {
  return (
    <>
        <ThemeProvider theme={theme}>
            <style jsx global>{`body {margin: 0px; padding: 0px;}`}</style>
            <NavBar></NavBar>
            <MainContent>
                {children}
            </MainContent>
        </ThemeProvider>
    </>
  );
};

export default PageLayout;