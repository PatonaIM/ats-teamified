import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { LandingPage } from './components/LandingPage';
import { JobsPage } from './components/JobsPage';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/jobs" element={<JobsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
