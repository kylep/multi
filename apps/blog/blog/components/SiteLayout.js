import { useContext } from 'react';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import HomeIcon from '@mui/icons-material/Home';
import RssFeedIcon from '@mui/icons-material/RssFeed';
import { Link } from '@mui/material';
import { Box } from '@mui/material';
import BlogSidebar from './BlogSidebar';
import { GlobalContext } from '../utils/GlobalContext';
import { useTheme } from '@mui/material/styles';




// spacing to make the header responsive
function ResponsiveRow({ children, sx }) {
  return (
    <Box sx={{
      display: 'flex',
      width: '100%',
      flexDirection: ['column', 'row'],  // Stack vertically on small screens, row on larger
      pl: ['3%', '3%', '6%', '9%'],
      pr: ['3%', '3%', '6%', '9%'],
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
      '@media (min-width:0px)': { height: "170px"},
      '@media (min-width:600px)': { height: "200px"},
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
export function SiteNavHeader() {
  return (
    <AppBar position="static" data-testid="Nav-AppBar" sx={{backgroundColor: 'white' }}>
      <Toolbar disableGutters variant="dense" data-testid="Nav-Toolbar" >
        <ResponsiveRow data-testid="Nav-ResponsiveRow" sx={{ flexDirection: 'row' }}>
          <HeaderNavLink href="/" data-testid="Nav-Link-Home" sx={{marginLeft: 0}}><HomeIcon /></HeaderNavLink>
          <HeaderNavLink href="/index1.html" data-testid="Nav-Link-Blog">Blog</HeaderNavLink>
          <HeaderNavLink href="/wiki.html" data-testid="Nav-Link-Wiki">Wiki</HeaderNavLink>
          <HeaderNavLink href="/about.html" data-testid="Nav-Link-About">About</HeaderNavLink>
          <HeaderNavLink href="/feed.xml" data-testid="Nav-Link-RSS"><RssFeedIcon sx={{ fontSize: '1.2rem' }} /></HeaderNavLink>
        </ResponsiveRow>
      </Toolbar>
    </AppBar>
  );
}

function SiteFooter() {
  const globalData = useContext(GlobalContext);
  const theme = useTheme();
  return (
    <ResponsiveRow
      sx={{ 
        width: '100%', 
        height: "50px",
        backgroundColor: theme.palette.headerGrey,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        border: "1px dotted #AAAAAA",
        padding: '0 10px'
      }}
    >
      <Typography variant="footerText" sx={{ 
        textAlign: 'center',
        wordWrap: 'break-word',  // ensure sha does not overflow on mobile
        overflowWrap: "anywhere",
      }}>
        Blog code last updated on {globalData.data.siteLastModified}:  
        <a href={`https://github.com/kylep/multi/commit/${globalData.data.lastGitCommitHash}`}> {globalData.data.lastGitCommitHash}</a>
      </Typography>
    </ResponsiveRow>
  );
}



// This is the main container that all pages are expected to be wrapped in
function SiteLayout({ children, context = true, hideSidebar = false }) {
  // with no context we cant render the sidebar or footer
  const sidebar_element = context && !hideSidebar ? <BlogSidebar /> : null;
  const footer_element = context ? <SiteFooter /> : null;
  const contentWidth = hideSidebar
    ? '100%'
    : ['100%', 'calc(100% - 300px)'];
  return (
    <Box suppressHydrationWarning>
      <SiteNavHeader />
      <SiteTitle />
      <ResponsiveRow>
        <Box sx={{
          width: contentWidth,
          padding: '20px',
        }}>
          {children}
        </Box>
        {!hideSidebar && (
          <Box sx={{
            width: ['100%', '300px'],
          }}>
            {sidebar_element}
          </Box>
        )}
      </ResponsiveRow>
      {footer_element}
    </Box>
  );
}

export default SiteLayout;
