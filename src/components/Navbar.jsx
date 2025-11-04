import React from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css'; // We'll create this for specific navbar styles

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        Max-Flow Workbench
      </div>
      <ul className="nav-links">
        <li>
          <NavLink to="/" end>Home</NavLink>
        </li>
        <li>
          <NavLink to="/visualize">Visualize</NavLink>
        </li>
        <li>
          <NavLink to="/learn">Learn</NavLink>
        </li>
        <li>
          <NavLink to="/compare">Compare</NavLink>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;

