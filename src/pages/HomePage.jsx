import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css'; // We will create this CSS file next

function HomePage() {
  return (
    <div className="home-page-container">
      {/* ---------------------------------- */}
      {/* 1. Hero Section */}
      {/* ---------------------------------- */}
      <header className="home-hero-section">
        <div className="home-hero-content">
          <h1 className="home-hero-title">Welcome to the Max-Flow Workbench</h1>
          <p className="home-hero-subtitle">
            Your deep-dive resource for understanding, visualizing, and comparing network flow algorithms.
          </p>
          <Link to="/visualize" className="home-cta-button primary">
            Start Visualizing Now
          </Link>
        </div>
      </header>

      {/* ---------------------------------- */}
      {/* 2. "What is Max-Flow?" Section */}
      {/* ---------------------------------- */}
      <section className="home-content-section">
        <div className="home-content-wrapper">
          <h2>What is the Max-Flow Problem?</h2>
          <p>
            The maximum flow problem is a classic challenge in optimization. Imagine a network of pipes, where each pipe has a maximum capacity. The goal is to find the maximum possible amount of "flow" (like water or data) that can be sent from a starting point (the <strong>source</strong>) to an ending point (the <strong>sink</strong>) without exceeding the capacity of any single pipe.
          </p>
          {/* This is a placeholder for a diagram. Using a real diagram here is a great idea. */}
          <img 
            src="https://placehold.co/800x400/34495e/ecf0f1?text=Simple+Flow+Graph+(s+->+a+->+t)" 
            alt="A simple flow graph diagram" 
            className="home-info-image"
          />
        </div>
      </section>

      {/* ---------------------------------- */}
      {/* 3. "Applications" Section */}
      {/* ---------------------------------- */}
      <section className="home-content-section alt-bg">
        <div className="home-content-wrapper">
          <h2>Real-World Applications</h2>
          <div className="home-card-container">
            
            <div className="home-info-card">
              <h3>Computer Networks</h3>
              <p>
                Calculating the maximum data throughput between two servers in a network, where routers and cables have limited bandwidth.
              </p>
            </div>
            
            <div className="home-info-card">
              <h3>Logistics & Supply Chain</h3>
              <p>
                Determining the maximum number of goods that can be shipped from a set of warehouses (sources) to a set of retail stores (sinks).
              </p>
            </div>
            
            <div className="home-info-card">
              <h3>Image Segmentation</h3>
              <p>
                An advanced use in computer vision (image-cut) where nodes are pixels and edge capacities represent pixel similarity, helping to separate a foreground object from its background.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ---------------------------------- */}
      {/* 4. "Call to Action" Section */}
      {/* ---------------------------------- */}
      <section className="home-content-section">
        <div className="home-content-wrapper">
          <h2>Ready to Dive Deeper?</h2>
          <p>
            Explore the algorithms, see them in action, and compare their performance.
          </p>
          <div className="home-button-group">
            <Link to="/learn" className="home-cta-button secondary">
              Learn the Theory
            </Link>
            <Link to="/compare" className="home-cta-button secondary">
              Compare Algorithms
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;