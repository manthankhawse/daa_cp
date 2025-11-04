import React from 'react';
import '../LearnPage.css';

function PushRelabelInfo() {
  return (
    <div className="learn-article">
      <h2>Push-Relabel Algorithm</h2>
      <p className="algo-subtitle">The "Local" Flooding Algorithm</p>

      <h3>Core Concept</h3>
      <p>
        This algorithm is completely different. It doesn't find paths at all. Instead, it works like a "local" physical simulation.
      </p>
      <p>
        Imagine the source 's' is a tap and the sink 't' is a drain. All other nodes are just junctions.
        1.  **Initialize:** Open the tap 's' completely, flooding all its neighbors. This creates a **Preflow** (a flow that might not be "legal" yet). Nodes now have **excess** flow. Set the `height` of 's' to be the highest (`N`) and all others to `0`.
        2.  **Find Active Node:** Pick any node (that isn't s or t) with `excess` flow.
        3.  **PUSH:** Try to push the excess flow "downhill" to a neighbor with a `height` exactly one level lower (`height(u) == height(v) + 1`).
        4.  **RELABEL:** If the active node has excess but *cannot* push to any neighbor (either they are "full" or all are "uphill"), the node *relabels* itself, increasing its `height` to be one level above its lowest neighbor.
      </p>
      <p>
        This "pushing" and "relabeling" continues until all excess flow (except at 's' and 't') has drained down to the sink 't'.
      </p>

      <h3>Key Terminology</h3>
      <table className="key-terms-table">
        <tbody>
          <tr>
            <td><strong>Preflow</strong></td>
            <td>A "pre-flow" where the flow *into* a node can be greater than the flow *out*. This is not a valid flow, but a temporary state.</td>
          </tr>
          <tr>
            <td><strong>Excess</strong></td>
            <td>The amount of preflow that has "piled up" at a node. `excess = flow_in - flow_out`.</td>
          </tr>
          <tr>
            <td><strong>Height (or Label)</strong></td>
            <td>A "height" assigned to each node, used to direct the flow. Flow can only move from a higher node to a lower node. The sink 't' is always at height 0.</td>
          </tr>
          <tr>
            <td><strong>Push</strong></td>
            <td>The operation of moving excess flow from a node `u` to a valid neighbor `v`.</td>
          </tr>
          <tr>
            <td><strong>Relabel</strong></td>
            <td>The operation of increasing a node's height when it has excess but cannot push it anywhere.</td>
          </tr>
        </tbody>
      </table>

      <h3>Pseudocode (Highest-Label Variant)</h3>
      <pre><code>
function PushRelabel(graph, s, t):
  initializePreflow(graph, s)
  
  // Create a list of active nodes
  activeNodes = findNodesWithExcess()

  // While there are active nodes (nodes with excess)
  while (node u = findHighestActiveNode(activeNodes)):
    
    // Try to PUSH
    pushed = false
    for each neighbor v of u:
      if (canPush(u, v)): // Check residual capacity AND height
        pushFlow(u, v)
        pushed = true
        // Add v to activeNodes if it's not s or t
        if (v != s and v != t): add v to activeNodes
        if (u.excess == 0): break

    // If no push was possible, RELABEL
    if (not pushed):
      relabel(u)
      
    // Remove u from activeNodes if its excess is 0
    if (u.excess == 0): remove u from activeNodes
      
  return excess at sink t
      </code></pre>

      <h3>Complexity Analysis</h3>
      <p>
        The time complexity (for the highest-label variant) is <strong>$O(V^3)$</strong>.
      </p>
      <p>
        <strong>Why?</strong> This analysis is much more complex. It's based on bounding the total number of `push` and `relabel` operations. There are at most $O(V^2)$ relabel operations. The number of "saturating" pushes is $O(V E)$, and the number of "non-saturating" pushes is $O(V^3)$. This makes the $O(V^3)$ term dominant.
      </p>

      <h3>Pros & Cons</h3>
      <ul className="pros-cons">
        <li className="pro"><strong>Very Fast:</strong> Often the fastest algorithm in practice, especially on dense graphs.</li>
        <li className="pro"><strong>Different Approach:</strong> Not being path-based makes it efficient in ways path-based algos can't be.</li>
        <li className="con"><strong>Extremely Complex:</strong> The most difficult of the three to understand, implement, and visualize.</li>
        <li className="con"><strong>Non-intuitive:</strong> The "steps" do not map cleanly to a simple "flow path," making it harder to follow.</li>
      </ul>
    </div>
  );
}

export default PushRelabelInfo;