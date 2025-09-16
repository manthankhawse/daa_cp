// @ts-nocheck
// Implements the Edmonds-Karp variant of the Ford-Fulkerson algorithm.

/**
 * Finds an augmenting path from source to sink using Breadth-First Search (BFS).
 * @param {object} residualGraph - The residual graph represented as an adjacency matrix (or map of maps).
 * @param {string} source - The source node ID.
 * @param {string} sink - The sink node ID.
 * @param {Array<string>} nodes - A list of all node IDs.
 * @returns {object|null} An object containing the path and its bottleneck flow, or null if no path exists.
 */
function bfs(residualGraph, source, sink, nodes) {
  const parent = {}; // To store the path
  const queue = [];
  const visited = new Set();

  queue.push(source);
  visited.add(source);
  parent[source] = null;

  while (queue.length > 0) {
    const u = queue.shift();
    if (u === sink) break; // Found the sink

    for (const v of nodes) {
      if (!visited.has(v) && residualGraph[u][v] > 0) {
        queue.push(v);
        visited.add(v);
        parent[v] = u;
      }
    }
  }

  // If we reached the sink, reconstruct the path
  if (parent[sink]) {
    let path = [];
    let current = sink;
    let pathFlow = Infinity;

    while (current !== null) {
      path.push(current);
      const prev = parent[current];
      if (prev !== null) {
        pathFlow = Math.min(pathFlow, residualGraph[prev][current]);
      }
      current = prev;
    }
    path.reverse();
    return { path, pathFlow };
  }

  return null; // No path found
}


/**
 * Runs the Ford-Fulkerson (Edmonds-Karp) algorithm to find the max flow.
 * @param {Array<string>} nodeIds - Array of unique node IDs.
 * @param {Array<object>} edges - Array of edge objects from user input { source, target, capacity }.
 * @param {string} source - The source node ID.
 * @param {string} sink - The sink node ID.
 * @returns {Array<object>} An array of step objects for visualization.
 */
export function runFordFulkerson(nodeIds, edges, source, sink) {
  const steps = [];
  let cumulativeFlows = {}; // Store cumulative flow for each edge ID

  // Initialize cumulative flows to 0
  edges.forEach(edge => {
    cumulativeFlows[`${edge.source}-${edge.target}`] = 0;
  });
  
  // Create the residual graph as a map of maps
  const residualGraph = {};
  nodeIds.forEach(u => {
    residualGraph[u] = {};
    nodeIds.forEach(v => {
      residualGraph[u][v] = 0;
    });
  });

  edges.forEach(edge => {
    residualGraph[edge.source][edge.target] = edge.capacity;
  });

  let pathResult;
  while ((pathResult = bfs(residualGraph, source, sink, nodeIds))) {
    const { path, pathFlow } = pathResult;

    // Update residual graph capacities
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i+1];
      residualGraph[u][v] -= pathFlow; // Decrease capacity of forward edge
      residualGraph[v][u] += pathFlow; // Increase capacity of backward edge
    }
    
    // Update cumulative flows for visualization
    const newCumulativeFlows = { ...cumulativeFlows };
    for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        const edgeId = `${u}-${v}`;
        const reverseEdgeId = `${v}-${u}`;

        // Check if a reverse edge exists in the original graph
        const reverseEdgeExists = edges.some(e => e.source === v && e.target === u);

        if (reverseEdgeExists && newCumulativeFlows[reverseEdgeId] > 0) {
            // This path uses a backward edge, so we are returning flow.
            const flowToReturn = Math.min(newCumulativeFlows[reverseEdgeId], pathFlow);
            newCumulativeFlows[reverseEdgeId] -= flowToReturn;
        } else {
             // Standard forward edge
            newCumulativeFlows[edgeId] = (newCumulativeFlows[edgeId] || 0) + pathFlow;
        }
    }
    cumulativeFlows = newCumulativeFlows;

    steps.push({
      path: path,
      pathFlow: pathFlow,
      description: `Found augmenting path ${path.join(' → ')}. Bottleneck is ${pathFlow}.`,
      edgeFlows: { ...cumulativeFlows },
    });
  }

  // Add the final termination step
  steps.push({
      path: [],
      pathFlow: 0,
      description: `No more augmenting paths found. The algorithm terminates.`,
      edgeFlows: { ...cumulativeFlows },
  });

  return steps;
}