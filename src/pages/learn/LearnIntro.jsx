import React from 'react';
import '../LearnPage.css'; // Use the same CSS for consistent styling

// This is the default component shown at the "/learn" URL
function LearnIntro() {
  return (
    <div className="learn-article">
      <h2>Learn the Algorithms</h2>
      <p>
        Welcome to the learning hub! This section provides a deep-dive into the "big three" max-flow algorithms. Each one approaches the problem with a different strategy, leading to significant differences in performance and complexity.
      </p>
      
      <h3>How to Use This Section</h3>
      <p>
        Use the sidebar navigation to select an algorithm. Each page includes:
      </p>
      <ul>
        <li>A high-level <strong>Core Concept</strong> to build your intuition.</li>
        <li>A list of <strong>Key Terminology</strong>.</li>
        <li>The <strong>Pseudocode</strong> for the algorithm.</li>
        <li>A <strong>Complexity Analysis</strong> (Big-O) and an explanation for it.</li>
        <li>A summary of the algorithm's <strong>Pros & Cons</strong>.</li>
      </ul>
      <p>
        Select an algorithm from the sidebar to begin your deep dive.
      </p>
    </div>
  );
}

export default LearnIntro;