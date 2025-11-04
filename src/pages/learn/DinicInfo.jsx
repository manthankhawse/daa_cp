import React from 'react';
import '../LearnPage.css';

function DinicInfo() {
  return (
    <div className="learn-article">
      <h2>Dinic's Algorithm</h2>
      <p className="algo-subtitle">The "Shortest-Path" Optimizer</p>

      <h3>Core Concept</h3>
      <p>
        Dinic's is a much smarter version of Edmonds-Karp. Instead of finding just *one* shortest path, it finds *all* shortest paths at once. It works in **Phases**.
      </p>
      <p>
        A single phase looks like this:
        1.  **Build Level Graph:** Run a BFS from 's' to build a "level graph." This graph assigns a level (distance from 's') to each node. All edges must go from level `i` to level `i+1`.
        2.  **Find Blocking Flow:** As long as the sink 't' is reachable, find a **blocking flow**. This means pushing flow using a Depth-First Search (DFS) *only* along the paths allowed by the level graph, until at least one edge on *every* s-t path in the level graph is saturated. This finds *many* paths in one go.
        3.  Once the flow is "blocked," the phase ends.
      </p>
      <p>
        The algorithm repeats these phases until the BFS in step 1 can no longer reach the sink 't'.
      </p>

      <h3>Key Terminology</h3>
      <table className="key-terms-table">
        <tbody>
          <tr>
            <td><strong>Level Graph</strong></td>
            <td>A subgraph built by a BFS that only contains "admissible" edges. An edge `(u, v)` is admissible if `level(v) = level(u) + 1`. This graph represents all *shortest* paths.</td>
          </tr>
          <tr>
            <td><strong>Blocking Flow</strong></td>
            <td>A flow that saturates at least one edge on *every* s-t path in the current level graph. This is the entire set of paths found in a single phase.</td>
          </tr>
        </tbody>
      </table>

      <h3>Pseudocode (High-Level)</h3>
      <pre><code>
function Dinic(graph, s, t):
  maxFlow = 0
  residualGraph = createResidualGraph(graph)

  // While the sink is reachable in the level graph
  while (levelGraph = buildLevelGraph(residualGraph, s, t)):
    
    // Find all paths in this level graph until a blocking flow is achieved
    // (This is often one or more DFS calls)
    blockingFlow = findBlockingFlow(residualGraph, levelGraph, s, t)
    
    if (blockingFlow == 0):
      break // No more flow can be pushed in this phase
      
    maxFlow = maxFlow + blockingFlow
      
  return maxFlow
      </code></pre>

      <h3>Complexity Analysis</h3>
      <p>
        The time complexity is <strong>$O(V^2 E)$</strong>.
      </p>
      <p>
        <strong>Why?</strong> The algorithm runs at most $O(V-1)$ phases, because in each phase, the shortest path to 't' must get at least one edge longer. Finding the blocking flow in one phase (using DFS) can be done in $O(V E)$ time. Therefore, the total time is $O(V) * O(V E) = O(V^2 E)$. On "unit capacity" graphs, it's even faster!
      </p>

      <h3>Pros & Cons</h3>
      <ul className="pros-cons">
        <li className="pro"><strong>Very Fast:</strong> One of the fastest and most commonly used max-flow algorithms in practice, especially for sparse graphs.</li>
        <li className="pro"><strong>Efficient:</strong> Greatly improves on Edmonds-Karp by "batching" path-finding into phases.</li>
        <li className="con"><strong>Complex:</strong> Significantly harder to implement and debug than Edmonds-Karp. The blocking flow logic is tricky.</li>
      </ul>
    </div>
  );
}

export default DinicInfo;