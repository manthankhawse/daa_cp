import React from "react";
import "../LearnPage.css";

function MPMInfo() {
  const cppCode = `struct MPM {
    struct FlowEdge {
        int v, u;
        long long cap, flow;
        FlowEdge(int v, int u, long long cap) : v(v), u(u), cap(cap), flow(0) {}
    };

    const long long flow_inf = 1e18;
    vector<FlowEdge> edges;
    vector<vector<int>> adj;
    vector<char> alive;
    vector<long long> pin, pout, ex;
    vector<list<int>> in, out;
    vector<int> level, q;
    int n, m = 0, s, t, qh, qt;

    MPM(int n, int s, int t) : n(n), s(s), t(t) {
        adj.resize(n); pin.resize(n); pout.resize(n);
        in.resize(n); out.resize(n); level.resize(n);
        ex.resize(n); q.resize(n); alive.resize(n);
    }

    void add_edge(int v, int u, long long cap) {
        edges.emplace_back(v, u, cap);
        edges.emplace_back(u, v, 0);
        adj[v].push_back(m);
        adj[u].push_back(m + 1);
        m += 2;
    }

    bool bfs() {
        fill(level.begin(), level.end(), -1);
        qh = 0; qt = 1; q[0] = s;
        level[s] = 0;
        while (qh < qt) {
            int v = q[qh++];
            for (int id : adj[v]) {
                if (edges[id].cap - edges[id].flow < 1) continue;
                if (level[edges[id].u] != -1) continue;
                level[edges[id].u] = level[v] + 1;
                q[qt++] = edges[id].u;
            }
        }
        return level[t] != -1;
    }

    long long pot(int v) { return min(pin[v], pout[v]); }

    void remove_node(int v) {
        for (int i : in[v]) {
            int u = edges[i].v;
            auto it = find(out[u].begin(), out[u].end(), i);
            if (it != out[u].end()) out[u].erase(it);
            pout[u] -= edges[i].cap - edges[i].flow;
        }
        for (int i : out[v]) {
            int u = edges[i].u;
            auto it = find(in[u].begin(), in[u].end(), i);
            if (it != in[u].end()) in[u].erase(it);
            pin[u] -= edges[i].cap - edges[i].flow;
        }
    }

    void push(int from, int to, long long f, bool forward) {
        fill(ex.begin(), ex.end(), 0);
        qh = qt = 0; q[qt++] = from; ex[from] = f;
        while (qh < qt) {
            int v = q[qh++];
            if (v == to) break;
            auto& edgesList = forward ? out[v] : in[v];
            for (auto it = edgesList.begin(); it != edgesList.end();) {
                int id = *it;
                int u = forward ? edges[id].u : edges[id].v;
                long long pushed = min(ex[v], edges[id].cap - edges[id].flow);
                if (pushed == 0) { ++it; continue; }

                if (forward) { pout[v] -= pushed; pin[u] -= pushed; }
                else { pin[v] -= pushed; pout[u] -= pushed; }

                edges[id].flow += pushed;
                edges[id ^ 1].flow -= pushed;
                ex[v] -= pushed;
                if (ex[u] == 0) q[qt++] = u;
                ex[u] += pushed;

                if (edges[id].cap == edges[id].flow) {
                    it = edgesList.erase(it);
                } else ++it;

                if (ex[v] == 0) break;
            }
        }
    }

    long long flow() {
        long long totalFlow = 0;
        while (true) {
            if (!bfs()) break;

            for (int i = 0; i < n; i++) {
                in[i].clear(); out[i].clear();
                pin[i] = pout[i] = 0; alive[i] = true;
            }

            for (int i = 0; i < m; i++) {
                if (edges[i].cap - edges[i].flow == 0) continue;
                int v = edges[i].v, u = edges[i].u;
                if (level[v] + 1 == level[u] && (level[u] <= level[t])) {
                    out[v].push_back(i);
                    in[u].push_back(i);
                    pin[u] += edges[i].cap - edges[i].flow;
                    pout[v] += edges[i].cap - edges[i].flow;
                }
            }

            pin[s] = pout[t] = flow_inf;
            while (true) {
                int ref = -1;
                for (int i = 0; i < n; i++) {
                    if (!alive[i]) continue;
                    if (ref == -1 || pot(i) < pot(ref)) ref = i;
                }
                if (ref == -1) break;
                if (pot(ref) == 0) { alive[ref] = false; remove_node(ref); continue; }

                long long f = pot(ref);
                totalFlow += f;
                push(ref, s, f, false);
                push(ref, t, f, true);
                alive[ref] = false;
                remove_node(ref);
            }
        }
        return totalFlow;
    }
};`;

  return (
    <div className="learn-article">
      <h2>MPM Algorithm (Malhotra–Pramodh-Kumar–Maheshwari)</h2>
      <p className="algo-subtitle">
        A Subtle but Elegant Optimization of Dinic’s Blocking Flow
      </p>

      <h3>Overview</h3>
      <p>
        The <strong>MPM algorithm</strong> is a variant of <strong>Dinic’s
        algorithm</strong> for computing the <em>maximum flow</em> in a
        network. While Dinic finds the blocking flow by repeatedly pushing flow
        along paths in a level graph, MPM optimizes this process by focusing on
        each vertex’s <em>potential</em> — a measure of how much flow can enter
        or leave it.
      </p>

      <p>
        The result: MPM achieves a theoretical time complexity of{" "}
        <strong>O(V³)</strong>, matching Dinic’s bound but often running faster
        in practice due to less redundant path traversal.
      </p>

      <h3>Core Idea</h3>
      <p>
        Like Dinic’s, MPM works in <strong>phases</strong> on a level graph of
        the residual network. But instead of pushing along explicit paths,
        it identifies a special node (the <em>reference node</em>) with the
        lowest “potential” and sends as much flow as possible through it —
        effectively saturating all its incident flow capacity.
      </p>

      <h3>Definitions</h3>
      <p>For each node v in the level graph L:</p>
      <ul>
        <li>
          <code>p_in(v)</code> = total incoming residual capacity.
        </li>
        <li>
          <code>p_out(v)</code> = total outgoing residual capacity.
        </li>
        <li>
          <code>p(v) = min(p_in(v), p_out(v))</code> — the node’s <strong>potential</strong>.
        </li>
      </ul>

      <p>
        The algorithm repeatedly picks a <strong>reference node</strong> r where{" "}
        <code>p(r)</code> is minimal and pushes flow equal to{" "}
        <code>p(r)</code> through it — effectively making <code>p(r) = 0</code>.
        That node is then removed from the layered graph.
      </p>

      <h3>Analogy</h3>
      <p>
        Imagine a layered irrigation system. Each layer (like Dinic’s level graph)
        channels water from source to sink. MPM doesn’t trace every pipe — instead,
        it finds the point of <em>least resistance</em> (the bottleneck node),
        flushes water through it until it’s dry, and then prunes it from the
        network. This continues until the entire level network is drained.
      </p>

      <h3>Algorithm Steps</h3>
      <ol>
        <li>Build the level graph using BFS.</li>
        <li>Compute <code>p_in</code> and <code>p_out</code> for all nodes.</li>
        <li>While nodes remain:
          <ul>
            <li>Find the node <code>r</code> with smallest <code>p(r)</code>.</li>
            <li>Push <code>p(r)</code> flow from s → r → t.</li>
            <li>Remove <code>r</code> and saturated edges.</li>
          </ul>
        </li>
        <li>Repeat the phase until no more augmenting paths exist.</li>
      </ol>

      <h3>Complexity</h3>
      <p>
        Each phase removes at least one node, requiring O(V²) per phase.  
        With at most V phases overall, total complexity = <strong>O(V³)</strong>.
      </p>

      <h3>Why It’s Interesting</h3>
      <ul>
        <li>Conceptually bridges Dinic’s (path-based) and Push–Relabel (vertex-based) views.</li>
        <li>Uses both in-flow and out-flow potentials — a dual perspective missing in Dinic.</li>
        <li>Reduces redundant traversals when multiple paths share bottlenecks.</li>
      </ul>

      <h3>When MPM Shines</h3>
      <ul>
        <li><strong>Moderately dense graphs</strong> where Dinic’s multiple DFS traversals are costly.</li>
        <li><strong>Networks with structured layering</strong> (like bipartite flows or image segment graphs).</li>
        <li><strong>Graphs with many medium-capacity edges</strong> — avoids redundant blocking flows.</li>
      </ul>

      <h3>Pros & Cons</h3>
      <ul className="pros-cons">
        <li className="pro"><strong>✅ Efficient in practice:</strong> Often faster than pure Dinic on complex graphs.</li>
        <li className="pro"><strong>✅ Balanced approach:</strong> Combines flow-level and vertex-level thinking.</li>
        <li className="pro"><strong>✅ Elegant theory:</strong> Clean potential-based logic makes it analyzable.</li>
        <li className="con"><strong>❌ Hard to implement:</strong> Requires complex bookkeeping (in/out sets, potentials).</li>
        <li className="con"><strong>❌ Rarely used:</strong> Few libraries or references implement it directly.</li>
        <li className="con"><strong>❌ Memory heavy:</strong> Needs adjacency, residual, and per-node structures.</li>
      </ul>

      <h3>Comparison Snapshot</h3>
      <table className="comparison-table">
        <thead>
          <tr>
            <th>Algorithm</th>
            <th>Time Complexity</th>
            <th>Core Idea</th>
            <th>Best Use</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Ford–Fulkerson</td>
            <td>O(E·F)</td>
            <td>Augment arbitrary paths</td>
            <td>Small graphs, integer capacities</td>
          </tr>
          <tr>
            <td>Edmonds–Karp</td>
            <td>O(V·E²)</td>
            <td>BFS shortest paths</td>
            <td>Medium sparse graphs</td>
          </tr>
          <tr>
            <td>Dinic</td>
            <td>O(V²E)</td>
            <td>Level graph + blocking flows</td>
            <td>Sparse or layered graphs</td>
          </tr>
          <tr>
            <td>MPM</td>
            <td>O(V³)</td>
            <td>Potential-based node elimination</td>
            <td>Medium-dense graphs</td>
          </tr>
          <tr>
            <td>Push–Relabel</td>
            <td>O(V³)</td>
            <td>Local push/relabel updates</td>
            <td>Dense networks</td>
          </tr>
        </tbody>
      </table>

      <h3>C++ Implementation</h3>
      <pre><code>{cppCode}</code></pre>

      <h3>Summary</h3>
      <ul>
        <li>MPM uses node potentials to find blocking flows without explicit DFS paths.</li>
        <li>It’s conceptually a midpoint between Dinic and Push–Relabel.</li>
        <li>Though rarely used, it’s a beautiful algorithm that demonstrates the richness of flow theory.</li>
      </ul>
    </div>
  );
}

export default MPMInfo;
