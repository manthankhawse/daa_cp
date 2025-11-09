import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import VisualizePage from './pages/VisualizePage';
import ComparePage from './pages/ComparePage';
import './App.css'; // Global styles

// --- KEY CHANGES ---
// 1. Import the new LearnPage layout
import LearnPage from './pages/LearnPage';

// 2. Import the new sub-page components
import LearnIntro from './pages/learn/LearnIntro';
import FordFulkersonInfo from './pages/learn/FordFulkersonInfo';
import DinicInfo from './pages/learn/DinicInfo';
import PushRelabelInfo from './pages/learn/PushRelabelInfo';
import MPMInfo from './pages/learn/MPMInfo';
// --- END KEY CHANGES ---


function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="content-area">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/visualize" element={<VisualizePage />} />
          <Route path="/compare" element={<ComparePage />} />

          {/* --- KEY CHANGE: Updated "/learn" Route --- */}
          {/* This <Route> now has children. The LearnPage component
              will render, and it will contain an <Outlet />
              that renders one of the children based on the URL. */}
          <Route path="/learn" element={<LearnPage />}>
            {/* This is the default page at /learn */}
            <Route index element={<LearnIntro />} />
            
            {/* These are the sub-pages */}
            <Route path="ford-fulkerson" element={<FordFulkersonInfo />} />
            <Route path="dinic" element={<DinicInfo />} />
            <Route path="push-relabel" element={<PushRelabelInfo />} />
            <Route path="MPM" element={<MPMInfo/>}/>
          </Route>
          {/* --- END KEY CHANGE --- */}

        </Routes>
      </main>
    </div>
  );
}

export default App;