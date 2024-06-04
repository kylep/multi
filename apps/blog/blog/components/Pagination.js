import React from 'react';


const PageNavButon = ({ children, isDisabled, isActive, onClick }) => (
    <button
      sx={{
        width: '30px',
        height: '30px',
        margin: '0 5px',
        backgroundColor: isDisabled ? '#ddd' : isActive ? '#007bff' : 'transparent',
        color: isActive ? 'white' : 'black',
        cursor: isDisabled ? 'not-allowed' : 'pointer'
      }}
      disabled={isDisabled}
      onClick={onClick}
    >
      {children}
    </button>
  );

  
  const Pagination = ({ currentPage, totalPages }) => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  
    return (
      <div>
        <PageNavButon
          isDisabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </PageNavButon>
        {pageNumbers.map(number => (
          <PageNavButon
            key={number}
            isActive={currentPage === number}
            onClick={() => onPageChange(number)}
          >
            {number}
          </PageNavButon>
        ))}
        <PageNavButon
          isDisabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </PageNavButon>
      </div>
    );
  };
  
  export default Pagination;