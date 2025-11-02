// /utils/pushRelabel.js
// @ts-nocheck
// Implements the Highest-Label Preflow-Push algorithm.

/**
 * Helper to update cumulative flow for the visualizer.
 * Handles forward and backward flow.
 */
function updateCumulativeFlow(cumulative, u, v, flow, allEdges) {
  const edgeId = `${u}-${v}`;
  const reverseEdgeId = `${v}-${u}`;
  
  // Check if the reverse edge (v, u) exists in the *original* graph
  const reverseEdgeExists = allEdges.some(e => e.source === v && e.target === u);

  // If we push flow 'backwards' against an existing reverse edge's flow
  if (reverseEdgeExists && cumulative[reverseEdgeId] > 0) {
    const flowToReturn = Math.min(cumulative[reverseEdgeId], flow);
    cumulative[reverseEdgeId] -= flowToReturn;
  } else {
    // Standard forward push
    cumulative[edgeId] = (cumulative[edgeId] || 0) + flow;
  }
}

/**
 * Runs the Push-Relabel (Highest-Label) algorithm.
 * @param {Array<string>} nodeIds - Array of unique node IDs.
 * @param {Array<object>} edges - Array of edge objects { source, target, capacity }.
 * @param {string} source - The source node ID.
 * @param {string} sink - The sink node ID.
 * @returns {Array<object>} An array of step objects for visualization.
 */
export function runPushRelabel(nodeIds, edges, source, sink) {
  const steps = [];
  const numNodes = nodeIds.length;

  // --- 1. Initialize State ---

  // nodeData[u] = { height: number, excess: number }
  const nodeData = {};
  nodeIds.forEach(id => {
    nodeData[id] = { height: 0, excess: 0 };
  });
  nodeData[source].height = numNodes;

  // residualGraph[u][v] = capacity
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

  // cumulativeFlows[edgeId] = flow (for visualizer)
  let cumulativeFlows = {};
  edges.forEach(edge => {
    cumulativeFlows[`${edge.source}-${edge.target}`] = 0;
  });

  // Helper to get all neighbors
  const getNeighbors = (u) => {
    return nodeIds.filter(v => residualGraph[u][v] > 0 || residualGraph[v][u] > 0);
  }

  // --- 2. Create Initial "Preflow" ---
  steps.push({
    type: 'init',
    description: `Initializing. Setting height of source 's' to ${numNodes}.`,
    edgeFlows: { ...cumulativeFlows },
    nodeData: JSON.parse(JSON.stringify(nodeData)), // Deep copy
    activeNode: source,
  });

  edges.filter(e => e.source === source).forEach(edge => {
    const v = edge.target;
    const capacity = edge.capacity;

    if (capacity > 0) {
      // Push full capacity from source
      residualGraph[source][v] = 0;
      residualGraph[v][source] = capacity;
      nodeData[v].excess = capacity;
      nodeData[source].excess -= capacity; // Will be negative, which is fine
      
      updateCumulativeFlow(cumulativeFlows, source, v, capacity, edges);

      steps.push({
        type: 'push',
        description: `Creating preflow: Pushing ${capacity} from 's' to '${v}'.`,
        edgeFlows: { ...cumulativeFlows },
        nodeData: JSON.parse(JSON.stringify(nodeData)),
        activeNode: source,
        pushEdge: `${source}-${v}`,
      });
    }
  });
  // Source excess is now 0 (or negative), its job is done.
  nodeData[source].excess = 0; 

  // --- 3. Main Algorithm: Discharge Active Nodes ---
  
  // List of all nodes that are not source or sink
  let activeNodes = nodeIds.filter(id => id !== source && id !== sink);

  // Find the active node with the highest height
  let highestActiveNode = activeNodes
    .filter(u => nodeData[u].excess > 0)
    .sort((a, b) => nodeData[b].height - nodeData[a].height)[0];

  while (highestActiveNode) {
    const u = highestActiveNode;
    let hasPushed = false;

    // --- 3a. Try to PUSH ---
    // Find a valid neighbor to push to
    const neighbors = getNeighbors(u);
    for (const v of neighbors) {
      // Can only push if residual capacity exists and height condition is met
      if (residualGraph[u][v] > 0 && nodeData[u].height === nodeData[v].height + 1) {
        const pushAmount = Math.min(nodeData[u].excess, residualGraph[u][v]);

        // Update residual graph
        residualGraph[u][v] -= pushAmount;
        residualGraph[v][u] += pushAmount;

        // Update excesses
        nodeData[u].excess -= pushAmount;
        nodeData[v].excess += pushAmount;

        // Update visual flows
        updateCumulativeFlow(cumulativeFlows, u, v, pushAmount, edges);

        steps.push({
          type: 'push',
          description: `Pushing ${pushAmount} from '${u}' (h:${nodeData[u].height}) to '${v}' (h:${nodeData[v].height}).`,
          edgeFlows: { ...cumulativeFlows },
          nodeData: JSON.parse(JSON.stringify(nodeData)),
          activeNode: u,
          pushEdge: `${u}-${v}`,
        });

        hasPushed = true;
        if (nodeData[u].excess === 0) break; // This node is done discharging
      }
    }

    // --- 3b. If no push was possible, RELABEL ---
    if (!hasPushed) {
      const minNeighborHeight = Math.min(
        ...neighbors
          .filter(v => residualGraph[u][v] > 0) // Only look at valid residual edges
          .map(v => nodeData[v].height)
      );
      
      const newHeight = minNeighborHeight + 1;
      const oldHeight = nodeData[u].height;
      nodeData[u].height = newHeight;

      steps.push({
        type: 'relabel',
        description: `Relabeling '${u}' from height ${oldHeight} to ${newHeight}.`,
        edgeFlows: { ...cumulativeFlows },
        nodeData: JSON.parse(JSON.stringify(nodeData)),
        activeNode: u,
        pushEdge: null,
      });
    }

    // Find the next highest active node
    highestActiveNode = activeNodes
      .filter(id => nodeData[id].excess > 0)
      .sort((a, b) => nodeData[b].height - nodeData[a].height)[0];
  }

  // --- 4. Final Step ---
  steps.push({
    type: 'final',
    description: 'No more active nodes. Algorithm terminates.',
    edgeFlows: { ...cumulativeFlows },
    nodeData: JSON.parse(JSON.stringify(nodeData)),
    activeNode: null,
    pushEdge: null,
  });

  return steps;
}