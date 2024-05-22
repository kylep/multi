import React, { useState } from 'react';

export const GlobalContext = React.createContext();

export const GlobalContextProvider = ({ children, globalData }) => {
    const [data, setData] = useState(globalData);
    return (
      <GlobalContext.Provider value={{ data, setData }}>
        {children}
      </GlobalContext.Provider>
    );
  };