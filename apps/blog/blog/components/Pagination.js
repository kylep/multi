import { Box } from '@mui/material';
import { ArrowBack, ArrowForward } from '@mui/icons-material';

const PageNavButon = ({ children, isDisabled, isActive, onClick }) => (
    <Box
      sx={{
        width: '30px',
        height: '30px',
        margin: '0 5px',
        paddingTop: '3px',
        backgroundColor: isDisabled ? '#ddd' : isActive ? '#007bff' : 'transparent',
        color: isActive ? 'white' : 'black',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        justifyContent: 'center',
      }}
      onClick={isDisabled ? null : onClick}
    >
      {children}
    </Box>
  );
  
  
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    console.log("Current Page: " + currentPage + " Total Pages: " + totalPages);
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  
    return (
      <Box sx={{
          marginTop: "8px",
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
          }}>
        <PageNavButon
          isDisabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ArrowBack />
        </PageNavButon>
        {pageNumbers.map(page => (
          <PageNavButon
            key={page}
            isActive={currentPage === page}
            onClick={() => onPageChange(page)}
          >
            {page}
          </PageNavButon>
        ))}
        <PageNavButon
          isDisabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ArrowForward />
        </PageNavButon>
      </Box>
    );
  };
  
  export default Pagination;