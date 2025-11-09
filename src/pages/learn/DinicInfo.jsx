import React from "react";
import "../LearnPage.css";

function DinicInfo() {
  const cppCode = `struct FlowEdge {
    int v, u;
    long long cap, flow = 0;
    FlowEdge(int v, int u, long long cap) : v(v), u(u), cap(cap) {}
};

struct Dinic {
    const long long flow_inf = 1e18;
    vector<FlowEdge> edges;
    vector<vector<int>> adj;
    int n, m = 0;
    int s, t;
    vector<int> level, ptr;
    queue<int> q;

    Dinic(int n, int s, int t) : n(n), s(s), t(t) {
        adj.resize(n);
        level.resize(n);
        ptr.resize(n);
    }

    void add_edge(int v, int u, long long cap) {
        edges.emplace_back(v, u, cap);
        edges.emplace_back(u, v, 0);
        adj[v].push_back(m);
        adj[u].push_back(m + 1);
        m += 2;
    }

    bool bfs() {
        while (!q.empty()) q.pop();
        q.push(s);
        fill(level.begin(), level.end(), -1);
        level[s] = 0;
        while (!q.empty()) {
            int v = q.front(); q.pop();
            for (int id : adj[v]) {
                if (edges[id].cap == edges[id].flow) continue;
                if (level[edges[id].u] != -1) continue;
                level[edges[id].u] = level[v] + 1;
                q.push(edges[id].u);
            }
        }
        return level[t] != -1;
    }

    long long dfs(int v, long long pushed) {
        if (pushed == 0) return 0;
        if (v == t) return pushed;
        for (int &cid = ptr[v]; cid < (int)adj[v].size(); cid++) {
            int id = adj[v][cid];
            int u = edges[id].u;
            if (level[v] + 1 != level[u]) continue;
            long long tr = dfs(u, min(pushed, edges[id].cap - edges[id].flow));
            if (tr == 0) continue;
            edges[id].flow += tr;
            edges[id ^ 1].flow -= tr;
            return tr;
        }
        return 0;
    }

    long long flow() {
        long long f = 0;
        while (true) {
            if (!bfs()) break;
            fill(ptr.begin(), ptr.end(), 0);
            while (long long pushed = dfs(s, flow_inf)) {
                f += pushed;
            }
        }
        return f;
    }
};`;

  return (
    <div className="learn-article">
      <h2>Maximum Flow – Dinic's Algorithm</h2>
      <p className="algo-subtitle">Discovered by Yefim Dinitz in 1970</p>

      <p>
        Dinic’s algorithm solves the <strong>maximum flow problem</strong> in{" "}
        <code>O(V²E)</code> time. It improves upon the Ford–Fulkerson and
        Edmonds–Karp methods by introducing a <strong>layered (level) network</strong>
        and efficiently computing <strong>blocking flows</strong> in phases.
      </p>

      <h3>Definitions</h3>
      <ul>
        <li>
          <strong>Residual network</strong> <code>Gʳ</code>: For every edge{" "}
          <code>(v, u)</code>, add
          <ul>
            <li>
              <code>(v, u)</code> with capacity <code>c(v, u) − f(v, u)</code>
            </li>
            <li>
              <code>(u, v)</code> with capacity <code>f(v, u)</code>
            </li>
          </ul>
        </li>
        <li>
          <strong>Layered network:</strong> Build via BFS from the source{" "}
          <code>s</code> keeping only edges with{" "}
          <code>level[u] = level[v] + 1</code>. It’s acyclic.
        </li>
        <li>
          <strong>Blocking flow:</strong> A flow that saturates at least one
          edge on every <code>s–t</code> path in the current level graph.
        </li>
      </ul>

      <h3>Algorithm Outline</h3>
      <ol>
        <li>Build a level graph via BFS.</li>
        <li>
          Use DFS to push flow along valid edges until a <strong>blocking flow</strong> is reached.
        </li>
        <li>Update residual capacities and repeat until sink is unreachable.</li>
      </ol>

      <h3>Proof of Correctness</h3>
      <p>
        When BFS can no longer reach the sink <code>t</code>, there’s no
        augmenting path in the residual network, meaning the flow is maximum
        (<em>Max-Flow Min-Cut theorem</em>).
      </p>

      <h3>Number of Phases</h3>
      <p>
        Dinic terminates in fewer than <code>V</code> phases because each phase
        increases the level of <code>t</code>. By Lemmas:
      </p>
      <ul>
        <li>
          <strong>Lemma 1:</strong> Levels never decrease:
          <code> level₍ᵢ₊₁₎[v] ≥ levelᵢ[v]</code>.
        </li>
        <li>
          <strong>Lemma 2:</strong> Sink level strictly increases:
          <code> level₍ᵢ₊₁₎[t] &gt; levelᵢ[t]</code>.
        </li>
      </ul>

      <h3>Finding Blocking Flow</h3>
      <p>
        DFS is used to push flow in the layered graph while maintaining a{" "}
        <code>ptr[v]</code> pointer to avoid retrying saturated edges.
        Each phase costs <code>O(VE)</code>.
      </p>

      <h3>Time Complexity</h3>
      <ul>
        <li>
          Each phase: <code>O(VE)</code>
        </li>
        <li>
          Phases ≤ <code>V</code>
        </li>
        <li>
          <strong>Total:</strong> <code>O(V²E)</code>
        </li>
      </ul>

      <h3>Practical Performance</h3>
      <ul>
        <li>
          <strong>Best for:</strong> Sparse graphs, bipartite matching, flow with
          small integral capacities, and unit-capacity networks.
        </li>
        <li>
          <strong>Also good for:</strong> Real-world flow networks with limited
          outgoing edges per vertex (like road, network, or pipeline graphs).
        </li>
        <li>
          <strong>Slower on:</strong> Very dense graphs (close to complete graphs)
          because <code>O(V²E)</code> scales poorly when <code>E ≈ V²</code>.
        </li>
        <li>
          <strong>Much faster in practice</strong> than Edmonds–Karp, often by 10×
          to 100×, since it pushes many paths per BFS phase.
        </li>
      </ul>

      <h3>Pros & Cons</h3>
      <ul className="pros-cons">
        <li className="pro">
          <strong>✅ Fast in practice:</strong> Especially efficient on sparse
          graphs and matching problems.
        </li>
        <li className="pro">
          <strong>✅ Predictable behavior:</strong> Level graph ensures systematic
          augmentation, no random path dependency.
        </li>
        <li className="pro">
          <strong>✅ Great theoretical properties:</strong> Works with integer or
          fractional capacities and supports multiple optimizations.
        </li>
        <li className="con">
          <strong>❌ Complex to implement:</strong> Requires careful handling of
          pointers and reverse edges.
        </li>
        <li className="con">
          <strong>❌ High memory use:</strong> Stores both forward and backward
          edges, making it heavier than Ford–Fulkerson.
        </li>
        <li className="con">
          <strong>❌ Not ideal for dense graphs:</strong> Complexity degrades to{" "}
          <code>O(V³)</code> or worse if E ≈ V².
        </li>
      </ul>

      <h3>Example Walkthrough</h3>
      <p>
        Consider the following graph:
      </p>
      <pre>
        <code>
{`Vertices: s, a, b, t
Edges (capacity):
s → a (3)
s → b (2)
a → b (1)
a → t (2)
b → t (3)`}
        </code>
      </pre>

      <p><strong>Phase 1: Build level graph (BFS)</strong></p>
      <pre>
        <code>
{`level[s] = 0
level[a] = 1
level[b] = 1
level[t] = 2`}
        </code>
      </pre>
      <p>
        The admissible edges (following level increases) are:
        <code> s→a, s→b, a→t, b→t </code>.
      </p>

      <p><strong>Find blocking flow (DFS)</strong></p>
      <ul>
        <li>Push 2 units along s→b→t (b→t saturated).</li>
        <li>Push 2 units along s→a→t (a→t saturated).</li>
      </ul>
      <p>Now total flow = 4. Both paths are blocked (t reached saturation).</p>

      <p><strong>Phase 2:</strong></p>
      <p>
        After updating residuals, BFS finds a new level graph including reverse
        edges like <code>t→b</code> and <code>t→a</code>. A new admissible path
        appears: <code>s→a→b→t</code> with capacity 1.
      </p>
      <p>
        Push 1 more unit along this path → <strong>total flow = 5</strong>.
      </p>

      <p>
        BFS now cannot reach <code>t</code>. The algorithm terminates with a
        maximum flow of <strong>5</strong>.
      </p>

      <h3>Unit Networks</h3>
      <p>
        A unit network has edges of capacity 1 and at most one incoming/outgoing
        per vertex (except s, t). Dinic runs in <strong>O(E√V)</strong>.
      </p>

      <h4>Unit-Capacity Networks</h4>
      <p>
        With unit capacities but arbitrary degree, complexity improves to{" "}
        <strong>O(E√E)</strong>, or <strong>O(E·V<sup>2/3</sup>)</strong> for
        dense graphs.
      </p>

      <h3>Pseudocode (High Level)</h3>
      <pre>
        <code>
{`function Dinic(graph, s, t):
    maxFlow = 0
    while buildLevelGraph(graph, s, t):
        while flow = sendFlow(graph, s, t, ∞):
            maxFlow += flow
    return maxFlow`}
        </code>
      </pre>

      <h3>Full C++ Implementation</h3>
      <pre><code>{cppCode}</code></pre>

      <h3>Practice Problem</h3>
      <ul>
        <li>
          <a
            href="https://www.spoj.com/problems/FASTFLOW/"
            target="_blank"
            rel="noreferrer"
          >
            SPOJ: FASTFLOW
          </a>
        </li>
      </ul>

      <h3>Summary</h3>
      <ul>
        <li>Uses BFS to create levels and DFS to push blocking flow.</li>
        <li>Guarantees fewer than V phases.</li>
        <li>
          Highly efficient in practice, especially for sparse and unit-capacity
          graphs.
        </li>
      </ul>
    </div>
  );
}

export default DinicInfo;
