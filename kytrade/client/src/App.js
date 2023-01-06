import './App.css';
import {BrowserRouter as Router, Routes, Route, Link} from 'react-router-dom';
import Experiments from './pages/Experiments.tsx';
import Screener from './pages/Screener.tsx';
import About from './pages/About.tsx';
import NavOverlay from './nav/NavOverlay.tsx';



function App() {
  return (
    <Router> 
      <NavOverlay>
        <Routes>
            <Route path='/experiments' element={<Experiments/>}></Route>
            <Route path='/screener' element={<Screener/>}></Route>
            <Route path='/about' element={<About/>}></Route>
        </Routes>
      </NavOverlay>
    </Router>
  );
}

export default App;
