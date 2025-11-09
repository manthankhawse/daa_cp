import React from "react";
import "../LearnPage.css";

function PushRelabelInfo() {
  const cppCodeBasic = `const int INF = 1000000000;

int n;
vector<vector<int>> capacity, flow;
vector<int> height, excess;

void push(int u, int v) {
    int d = min(excess[u], capacity[u][v] - flow[u][v]);
    flow[u][v] += d;
    flow[v][u] -= d;
    excess[u] -= d;
    excess[v] += d;
}

void relabel(int u) {
    int d = INF;
    for (int v = 0; v < n; v++) {
        if (capacity[u][v] - flow[u][v] > 0)
            d = min(d, height[v]);
    }
    if (d < INF) height[u] = d + 1;
}

int max_flow(int s, int t) {
    height.assign(n, 0);
    height[s] = n;
    flow.assign(n, vector<int>(n, 0));
    excess.assign(n, 0);

    for (int v = 0; v < n; v++) {
        if (capacity[s][v] > 0) {
            flow[s][v] = capacity[s][v];
            flow[v][s] = -capacity[s][v];
            excess[v] = capacity[s][v];
        }
    }

    bool progress = true;
    while (progress) {
        progress = false;
        for (int u = 0; u < n; u++) {
            if (u != s && u != t && excess[u] > 0) {
                for (int v = 0; v < n && excess[u]; v++) {
                    if (capacity[u][v] - flow[u][v] > 0 && height[u] == height[v] + 1)
                        push(u, v), progress = true;
                }
                if (excess[u] > 0) relabel(u), progress = true;
            }
        }
    }

    int maxflow = 0;
    for (int v = 0; v < n; v++) maxflow += flow[v][t];
    return maxflow;
};`;

  const cppCodeFaster = `const int INF = 1000000000;

int n;
vector<vector<int>> capacity, flow;
vector<int> height, excess;

void push(int u, int v) {
    int d = min(excess[u], capacity[u][v] - flow[u][v]);
    flow[u][v] += d;
    flow[v][u] -= d;
    excess[u] -= d;
    excess[v] += d;
}

void relabel(int u) {
    int d = INF;
    for (int i = 0; i < n; i++) {
        if (capacity[u][i] - flow[u][i] > 0)
            d = min(d, height[i]);
    }
    if (d < INF) height[u] = d + 1;
}

vector<int> find_max_height_vertices(int s, int t) {
    vector<int> max_height;
    for (int i = 0; i < n; i++) {
        if (i != s && i != t && excess[i] > 0) {
            if (!max_height.empty() && height[i] > height[max_height[0]])
                max_height.clear();
            if (max_height.empty() || height[i] == height[max_height[0]])
                max_height.push_back(i);
        }
    }
    return max_height;
}

int max_flow(int s, int t) {
    height.assign(n, 0);
    height[s] = n;
    flow.assign(n, vector<int>(n, 0));
    excess.assign(n, 0);
    excess[s] = INF;

    for (int i = 0; i < n; i++) {
        if (i != s)
            push(s, i);
    }

    vector<int> current;
    while (!(current = find_max_height_vertices(s, t)).empty()) {
        for (int i : current) {
            bool pushed = false;
            for (int j = 0; j < n && excess[i]; j++) {
                if (capacity[i][j] - flow[i][j] > 0 && height[i] == height[j] + 1) {
                    push(i, j);
                    pushed = true;
                }
            }
            if (!pushed) {
                relabel(i);
                break;
            }
        }
    }

    return excess[t];
};`;

  return (
    <div className="learn-article">
      <h2>Push–Relabel (Preflow–Push) Algorithm</h2>
      <p className="algo-subtitle">The “Local Flooding” Approach to Maximum Flow</p>

      <h3>Core Concept</h3>
      <p>
        Unlike Ford–Fulkerson or Dinic, the <strong>Push–Relabel algorithm</strong>{" "}
        doesn’t search for paths from <code>s</code> to <code>t</code>. Instead, it
        simulates water pressure locally — every node “pushes” its excess flow
        downhill to lower neighbors until equilibrium is reached.
      </p>

      <h3>How It Works</h3>
      <ol>
        <li><strong>Initialize:</strong> Set <code>height[s] = n</code>; push all possible flow from <code>s</code> to neighbors.</li>
        <li><strong>Push:</strong> From an active vertex <code>u</code> (with excess), push flow to <code>v</code> if <code>height[u] = height[v] + 1</code>.</li>
        <li><strong>Relabel:</strong> If <code>u</code> can’t push to any neighbor, increase its height to one more than the smallest neighbor it can reach.</li>
        <li>Repeat until all vertices (except s and t) have zero excess.</li>
      </ol>

      <h3>Definitions</h3>
      <ul>
        <li><strong>Preflow:</strong> Flow that may violate conservation (<code>inflow ≥ outflow</code>).</li>
        <li><strong>Excess:</strong> Stored overflow at a vertex.</li>
        <li><strong>Height (Label):</strong> Integer “altitude” controlling push direction.</li>
        <li><strong>Push:</strong> Move excess from higher to lower node.</li>
        <li><strong>Relabel:</strong> Raise node height when blocked.</li>
      </ul>

      <h3>Intuition</h3>
      <p>
        Imagine the network as a system of connected pipes. The source <code>s</code> starts
        full of water (height n). Water flows downhill to lower nodes and fills them.
        When a node can’t drain its excess, it “rises” (relabels) until it can discharge.
        Eventually, all water drains into <code>t</code>.
      </p>

      <h3>Example</h3>
      <pre>
        <code>
{`Vertices: s, a, b, t
Edges (capacity):
s → a (4)
s → b (2)
a → t (3)
b → t (3)
a → b (2)`}
        </code>
      </pre>
      <p>
        1️⃣ Push from s: s→a = 4, s→b = 2 → a.excess = 4, b.excess = 2  
        2️⃣ Relabel a to 1, push a→t = 3 → a.excess = 1, t.excess = 3  
        3️⃣ Relabel b to 1, push b→t = 2 → t.excess = 5 → <strong>Max flow = 5</strong>.
      </p>

      <h3>Algorithm Correctness</h3>
      <p>
        The algorithm maintains valid labeling (height conditions) and preflow
        throughout. When no vertex has excess (other than s/t), the preflow is a
        valid maximum flow.
      </p>

      <h3>Complexity</h3>
      <ul>
        <li>Relabel operations: O(V²)</li>
        <li>Saturating pushes: O(VE)</li>
        <li>Non-saturating pushes: O(V²E)</li>
      </ul>
      <p>
        → <strong>Basic version:</strong> O(V²E) (≈ O(V⁴))  
        → <strong>Highest-label version:</strong> O(VE + V²√E) ≈ O(V³)
      </p>

      <h3>Implementation (Basic Version)</h3>
      <pre><code>{cppCodeBasic}</code></pre>

      <h3>Optimized Highest-Label Implementation (O(VE + V²√E))</h3>
      <p>
        This version always chooses the active vertex with the <strong>maximum
        height</strong>, leading to fewer relabel operations and faster convergence.
        It’s the practical implementation used in competitive programming libraries.
      </p>
      <pre><code>{cppCodeFaster}</code></pre>

      <h3>Practical Performance</h3>
      <ul>
        <li><strong>Best for:</strong> Dense graphs with many edges.</li>
        <li><strong>Excellent for:</strong> Image segmentation, network routing, circulation problems.</li>
        <li><strong>Weaker for:</strong> Sparse graphs — use Dinic’s there.</li>
      </ul>

      <h3>Pros & Cons</h3>
      <ul className="pros-cons">
        <li className="pro"><strong>✅ Extremely fast:</strong> Outperforms Dinic on dense graphs.</li>
        <li className="pro"><strong>✅ Local operations:</strong> No need for global path searches.</li>
        <li className="pro"><strong>✅ Parallelizable:</strong> Works well on multi-threaded systems.</li>
        <li className="con"><strong>❌ Complex:</strong> Hard to visualize or debug.</li>
        <li className="con"><strong>❌ Memory-heavy:</strong> Stores multiple matrices and state arrays.</li>
      </ul>

      <h3>Comparison Snapshot</h3>
      <table className="comparison-table">
        <thead>
          <tr>
            <th>Algorithm</th>
            <th>Complexity</th>
            <th>Best for</th>
            <th>Approach</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Ford–Fulkerson</td>
            <td>O(E·F)</td>
            <td>Small integer-capacity graphs</td>
            <td>Path-based (DFS/BFS)</td>
          </tr>
          <tr>
            <td>Edmonds–Karp</td>
            <td>O(V·E²)</td>
            <td>Medium-sized graphs</td>
            <td>Shortest augmenting paths (BFS)</td>
          </tr>
          <tr>
            <td>Dinic</td>
            <td>O(V²E) / O(E√V)</td>
            <td>Sparse or layered graphs</td>
            <td>Level graph + blocking flow</td>
          </tr>
          <tr>
            <td>Push–Relabel</td>
            <td>O(V²E) → O(V³) (optimized)</td>
            <td>Dense, high-capacity graphs</td>
            <td>Local preflow updates</td>
          </tr>
        </tbody>
      </table>

      <h3>Practice Problems</h3>
      <ul>
        <li><a href="https://cses.fi/problemset/task/1694" target="_blank" rel="noreferrer">CSES - Download Speed</a></li>
        <li><a href="https://cses.fi/problemset/task/1696" target="_blank" rel="noreferrer">CSES - School Dance</a></li>
        <li><a href="https://codeforces.com/problemset/problem/498/C" target="_blank" rel="noreferrer">Codeforces - Array and Operations</a></li>
      </ul>

      <h3>Summary</h3>
      <ul>
        <li>Completely local algorithm — no augmenting paths.</li>
        <li>Converts a preflow into a max flow using push/relabel operations.</li>
        <li>Highest-label variant achieves O(V³) and dominates on dense networks.</li>
      </ul>
    </div>
  );
}

export default PushRelabelInfo;
