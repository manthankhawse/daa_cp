import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './LearnPage.css';

// This component is the main layout for the /learn section.
// It renders the sidebar and an <Outlet>, which is a placeholder
// for the nested route components (like FordFulkersonInfo).
function LearnPage() {
  return (
    <div className="learn-container">
      <nav className="learn-sidebar">
        <h3>Algorithms</h3>
        <ul>
          <li>
            {/* `end` prop ensures this isn't "active" when child routes are active */}
            <NavLink to="/learn" end>
              Overview
            </NavLink>
          </li>
          <li>
            <NavLink to="/learn/ford-fulkerson">
              Ford-Fulkerson
            </NavLink>
          </li>
          <li>
            <NavLink to="/learn/dinic">
              Dinic's Algorithm
            </NavLink>
          </li>
          <li>
            <NavLink to="/learn/push-relabel">
              Push-Relabel
            </NavLink>
            <NavLink to="/learn/MPM">
              MPM
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="learn-content">
        {/* The selected sub-page (e.g., DinicInfo) will be rendered here */}
        <Outlet />
      </div>
    </div>
  );
}

export default LearnPage;