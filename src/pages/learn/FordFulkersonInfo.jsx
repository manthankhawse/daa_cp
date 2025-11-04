import React from 'react';
import '../LearnPage.css'; // Use the same CSS

function FordFulkersonInfo() {
  return (
    <div className="learn-article">
      <h2>Ford-Fulkerson (Edmonds-Karp)</h2>
      <p className="algo-subtitle">The Path-Finding Pioneer</p>
      
      <h3>Core Concept</h3>
      <p>
        This algorithm has one simple idea: "As long as I can find *any* path from the source to the sink with available capacity, I will."
      </p>
      <p>
        It works like this:
        1.  Find a path (any path) from **s** to **t** that isn't "full." This is an **Augmenting Path**.
        2.  Find the **bottleneck** of that path (the smallest available capacity on any edge).
        3.  "Push" that bottleneck amount of flow along the path.
        4.  Update the **Residual Graph** (a graph that tracks remaining capacity).
        5.  Repeat from step 1 until no more paths can be found.
      </p>
      <p>
        The **Edmonds-Karp** variant simply specifies *how* to find the path in step 1: use a **Breadth-First Search (BFS)**. This guarantees you find the *shortest* path (in number of edges), which is crucial for efficiency.
      </p>

      <h3>Key Terminology</h3>
      <table className="key-terms-table">
        <tbody>
          <tr>
            <td><strong>Residual Graph</strong></td>
            <td>A "ghost" graph that shows the *remaining* available capacity. For every edge `(u, v)` with flow `f/c`, the residual graph has an edge `(u, v)` with capacity `c - f` and a *reverse* edge `(v, u)` with capacity `f` (allowing the algorithm to "undo" flow).</td>
          </tr>
          <tr>
            <td><strong>Augmenting Path</strong></td>
            <td>A simple path from 's' to 't' in the *residual graph* that has a capacity greater than 0.</td>
          </tr>
          <tr>
            <td><strong>Bottleneck</strong></td>
            <td>The minimum residual capacity of any edge along an augmenting path. This is the maximum flow you can push through that specific path.</td>
          </tr>
        </tbody>
      </table>

      <h3>Pseudocode (Edmonds-Karp)</h3>
      <pre><code>
function EdmondsKarp(graph, s, t):
  maxFlow = 0
  residualGraph = createResidualGraph(graph)

  // While an augmenting path exists
  while (path = BFS(residualGraph, s, t)):
    
    // Find the bottleneck capacity of the path
    bottleneck = findBottleneck(path)
    maxFlow = maxFlow + bottleneck

    // Update the residual graph
    for each edge (u, v) in path:
      residualGraph[u][v] = residualGraph[u][v] - bottleneck
      residualGraph[v][u] = residualGraph[v][u] + bottleneck
      
  return maxFlow
      </code></pre>

      <h3>Complexity Analysis</h3>
      <p>
        The time complexity is <strong>$O(V E^2)$</strong>.
      </p>
      <p>
        <strong>Why?</strong> The BFS to find one path takes $O(E)$ time. In the worst case, the algorithm might only find a path that adds 1 unit of flow at a time (e.g., on a graph with capacities of 1,000,000). The total number of augmentations can be as high as $O(V E)$. Therefore, the total time is $O(E) * O(V E) = O(V E^2)$.
      </p>

      <h3>Pros & Cons</h3>
      <ul className="pros-cons">
        <li className="pro"><strong>Simple:</strong> Easiest to understand and implement. A great starting point.</li>
        <li className="pro"><strong>Correct:</strong> Guaranteed to find the max flow (due to the Max-Flow Min-Cut Theorem).</li>
        <li className="con"><strong>Slow:</strong> On certain "bad" graphs, its performance is very poor. It can be slow even when flow capacities are large.</li>
      </ul>
    </div>
  );
}

export default FordFulkersonInfo;