import React from "react";
import "../LearnPage.css";

function FordFulkersonInfo() {
  const cppCode = `int n;
vector<vector<int>> capacity;
vector<vector<int>> adj;

int bfs(int s, int t, vector<int>& parent) {
    fill(parent.begin(), parent.end(), -1);
    parent[s] = -2;
    queue<pair<int, int>> q;
    q.push({s, INT_MAX});

    while (!q.empty()) {
        int cur = q.front().first;
        int flow = q.front().second;
        q.pop();

        for (int next : adj[cur]) {
            if (parent[next] == -1 && capacity[cur][next]) {
                parent[next] = cur;
                int new_flow = min(flow, capacity[cur][next]);
                if (next == t)
                    return new_flow;
                q.push({next, new_flow});
            }
        }
    }

    return 0;
}

int maxflow(int s, int t) {
    int flow = 0;
    vector<int> parent(n);
    int new_flow;

    while ((new_flow = bfs(s, t, parent))) {
        flow += new_flow;
        int cur = t;
        while (cur != s) {
            int prev = parent[cur];
            capacity[prev][cur] -= new_flow;
            capacity[cur][prev] += new_flow;
            cur = prev;
        }
    }

    return flow;
}`;

  return (
    <div className="learn-article">
      <h2>Ford–Fulkerson & Edmonds–Karp Algorithm</h2>
      <p className="algo-subtitle">The Path-Finding Pioneer of Maximum Flow</p>

      <h3>Core Concept</h3>
      <p>
        The <strong>Ford–Fulkerson method</strong> solves the{" "}
        <em>maximum flow problem</em> by repeatedly finding paths from the
        source (<code>s</code>) to the sink (<code>t</code>) that can carry
        additional flow, called <strong>augmenting paths</strong>. On each
        iteration, it pushes as much flow as possible through that path and
        updates a <strong>residual graph</strong> representing remaining
        capacities.
      </p>

      <p>
        The <strong>Edmonds–Karp algorithm</strong> is a specific
        implementation of Ford–Fulkerson that uses{" "}
        <strong>BFS (Breadth-First Search)</strong> to always find the shortest
        augmenting path. This guarantees polynomial-time performance.
      </p>

      <h3>Flow Network</h3>
      <p>
        A <strong>flow network</strong> is a directed graph where each edge{" "}
        <code>(u, v)</code> has a non-negative <strong>capacity</strong>{" "}
        <code>c(u, v)</code>. Two vertices are special:
      </p>
      <ul>
        <li>
          <strong>Source (s)</strong> – where all flow originates.
        </li>
        <li>
          <strong>Sink (t)</strong> – where all flow ends up.
        </li>
      </ul>
      <p>
        The <strong>flow</strong> function <code>f(u, v)</code> must satisfy:
      </p>
      <pre>
        <code>
{`1. Capacity constraint:   f(u, v) ≤ c(u, v)
2. Flow conservation:      Σ_in(u) f(v, u) = Σ_out(u) f(u, v)   (for all u ≠ s, t)`}
        </code>
      </pre>

      <h3>Water Pipe Analogy</h3>
      <p>
        Think of each edge as a pipe, with its capacity being the width of the
        pipe and the flow being the amount of water currently flowing. The
        algorithm keeps pushing more “water” from <code>s</code> to{" "}
        <code>t</code> until no more can be sent through any possible path.
      </p>

      <h3>Algorithm Steps</h3>
      <ol>
        <li>Initialize all flows to 0.</li>
        <li>
          Find an <strong>augmenting path</strong> from <code>s</code> to{" "}
          <code>t</code> in the <strong>residual graph</strong> (edges with
          available capacity &gt; 0).
        </li>
        <li>
          Compute the <strong>bottleneck capacity</strong> – the minimum
          residual capacity along that path.
        </li>
        <li>
          Push flow equal to that bottleneck along the path, and update the
          residual graph (add reverse edges).
        </li>
        <li>Repeat until no more augmenting paths exist.</li>
      </ol>

      <h3>Residual Graph</h3>
      <p>
        For each edge <code>(u, v)</code> with capacity <code>c(u, v)</code>{" "}
        and current flow <code>f(u, v)</code>:
      </p>
      <ul>
        <li>
          The <strong>forward edge</strong> has capacity{" "}
          <code>c(u, v) − f(u, v)</code>.
        </li>
        <li>
          The <strong>reverse edge</strong> <code>(v, u)</code> has capacity{" "}
          <code>f(u, v)</code>.
        </li>
      </ul>

      <h3>Example Walkthrough</h3>
      <p>
        Consider a simple flow network:
      </p>
      <pre>
        <code>
{`Vertices: s, a, b, t
Edges (capacity):
s → a (4)
s → b (2)
a → b (1)
a → t (2)
b → t (3)`}
        </code>
      </pre>

      <p><strong>Step 1:</strong> Find augmenting path <code>s→a→t</code></p>
      <p>Bottleneck = 2 → push 2 units of flow.</p>

      <p><strong>Step 2:</strong> Next path <code>s→b→t</code></p>
      <p>Bottleneck = 2 → push 2 units of flow.</p>

      <p><strong>Step 3:</strong> Next path <code>s→a→b→t</code></p>
      <p>Bottleneck = 1 → push 1 unit of flow.</p>

      <p>Total flow = <strong>5</strong>. No more augmenting paths exist.</p>

      <h3>Mathematical Guarantee</h3>
      <p>
        When all capacities are integers, Ford–Fulkerson guarantees that both
        the <strong>maximum flow value</strong> and individual edge flows are
        integers (Integral Flow Theorem).
      </p>
      <p>
        However, with <em>irrational</em> capacities, it might never terminate,
        because the flow increments could become infinitesimally small.
      </p>

      <h3>Edmonds–Karp Variant</h3>
      <p>
        The Edmonds–Karp algorithm is a BFS-based Ford–Fulkerson implementation.
        It chooses the <em>shortest augmenting path</em> each time, which
        ensures the algorithm runs in polynomial time.
      </p>
      <ul>
        <li>BFS cost per augmentation: <code>O(E)</code></li>
        <li>Each edge can only become critical O(V) times</li>
        <li>
          <strong>Total Complexity:</strong> <code>O(V·E²)</code>
        </li>
      </ul>

      <h3>Intuition for the O(V·E²) Bound</h3>
      <p>
        Every time a path is used, at least one edge becomes saturated. If that
        edge is used again in another augmenting path, the distance from the
        source to that edge in the BFS increases. Since the maximum distance is{" "}
        <code>V</code>, each edge can be saturated at most O(V) times, giving{" "}
        <code>O(V·E²)</code> total.
      </p>

      <h3>Implementation (C++)</h3>
      <pre><code>{cppCode}</code></pre>

      <h3>Practical Performance</h3>
      <ul>
        <li>
          <strong>Best for:</strong> Sparse and medium-sized networks with
          integer capacities.
        </li>
        <li>
          <strong>Struggles with:</strong> Very large or dense graphs with huge
          capacities (many augmentations).
        </li>
        <li>
          <strong>Use Dinic’s instead</strong> if you need performance on
          large-scale graphs or competitive programming.
        </li>
        <li>
          <strong>Use Push–Relabel</strong> if you need best performance on
          dense graphs.
        </li>
      </ul>

      <h3>Pros & Cons</h3>
      <ul className="pros-cons">
        <li className="pro">
          <strong>✅ Simple:</strong> Intuitive “path + push” idea.
        </li>
        <li className="pro">
          <strong>✅ Correct:</strong> Guaranteed to find the true max flow.
        </li>
        <li className="pro">
          <strong>✅ Modular:</strong> Can combine with different path-finding
          strategies (DFS, BFS, Dijkstra).
        </li>
        <li className="con">
          <strong>❌ Potentially infinite loop:</strong> If capacities are
          irrational, algorithm might never terminate.
        </li>
        <li className="con">
          <strong>❌ Slow for large graphs:</strong> Performance is poor on dense
          networks (<code>O(V·E²)</code>).
        </li>
        <li className="con">
          <strong>❌ Recomputes paths often:</strong> Can reprocess many edges
          repeatedly.
        </li>
      </ul>

      <h3>Applications</h3>
      <ul>
        <li>Network routing and bandwidth allocation</li>
        <li>Bipartite matching</li>
        <li>Project assignment and job scheduling</li>
        <li>Image segmentation and graph cuts</li>
      </ul>

      <h3>Max-Flow Min-Cut Theorem</h3>
      <p>
        The theorem states that the <strong>maximum flow value</strong> from{" "}
        <code>s</code> to <code>t</code> equals the <strong>minimum cut
        capacity</strong> that separates <code>s</code> and <code>t</code>.
        After computing a max flow, you can find a minimum cut by running DFS in
        the residual graph from <code>s</code> — the vertices reachable from{" "}
        <code>s</code> define one side of the cut.
      </p>

      <h3>Practice Problems</h3>
      <ul>
        <li>
          <a
            href="https://cses.fi/problemset/task/1694"
            target="_blank"
            rel="noreferrer"
          >
            CSES - Download Speed
          </a>
        </li>
        <li>
          <a
            href="https://cses.fi/problemset/task/1695"
            target="_blank"
            rel="noreferrer"
          >
            CSES - Police Chase
          </a>
        </li>
        <li>
          <a
            href="https://cses.fi/problemset/task/1696"
            target="_blank"
            rel="noreferrer"
          >
            CSES - School Dance
          </a>
        </li>
        <li>
          <a
            href="https://cses.fi/problemset/task/1711"
            target="_blank"
            rel="noreferrer"
          >
            CSES - Distinct Routes
          </a>
        </li>
        <li>
          <a
            href="https://codeforces.com/contest/498/problem/c"
            target="_blank"
            rel="noreferrer"
          >
            Codeforces - Array and Operations
          </a>
        </li>
      </ul>

      <h3>Summary</h3>
      <ul>
        <li>
          Ford–Fulkerson is the conceptual foundation for all max-flow
          algorithms.
        </li>
        <li>
          Edmonds–Karp gives it a predictable polynomial bound (
          <code>O(V·E²)</code>).
        </li>
        <li>
          Dinic’s and Push–Relabel are faster successors built on the same idea.
        </li>
      </ul>
    </div>
  );
}

export default FordFulkersonInfo;
