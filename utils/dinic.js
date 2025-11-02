// /utils/dinic.js
// @ts-nocheck
// Implements Dinic's algorithm for max flow.

// ... (buildLevelGraph function is IDENTICAL) ...
function buildLevelGraph(residualGraph, source, sink, nodeIds) {
  const levels = {}; 
  nodeIds.forEach(node => (levels[node] = -1)); 

  const queue = [];
  queue.push(source);
  levels[source] = 0;

  while (queue.length > 0) {
    const u = queue.shift();
    for (const v of nodeIds) {
      if (levels[v] < 0 && residualGraph[u][v] > 0) {
        levels[v] = levels[u] + 1;
        queue.push(v);
      }
    }
  }
  return levels[sink] < 0 ? null : levels;
}


// ... (findPathAndFlow function is IDENTICAL) ...
function findPathAndFlow(residualGraph, u, sink, levels, pushedFlow) {
  if (pushedFlow === 0) return null;
  if (u === sink) {
    return { path: [sink], pathFlow: pushedFlow };
  }

  for (const v of Object.keys(residualGraph[u])) {
    if (levels[v] === levels[u] + 1 && residualGraph[u][v] > 0) {
      const remainingCapacity = residualGraph[u][v];
      const flowToPush = Math.min(pushedFlow, remainingCapacity);
      
      const result = findPathAndFlow(residualGraph, v, sink, levels, flowToPush);

      if (result) {
        const { path, pathFlow } = result;
        residualGraph[u][v] -= pathFlow;
        residualGraph[v][u] += pathFlow;
        return { path: [u, ...path], pathFlow };
      }
    }
  }
  return null;
}

/**
 * Runs Dinic's algorithm.
 * @returns {Array<object>} An array of step objects for visualization.
 */
export function runDinic(nodeIds, edges, source, sink) {
  const steps = [];
  let cumulativeFlows = {};
  edges.forEach(edge => {
    cumulativeFlows[`${edge.source}-${edge.target}`] = 0;
  });

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

  let levels;
  let phase = 1;

  // Loop as long as a level graph (and thus a path) can be built
  while ((levels = buildLevelGraph(residualGraph, source, sink, nodeIds))) {
    
    // --- KEY CHANGE: Track all paths/flow found in THIS phase ---
    let phaseTotalFlow = 0;
    const pathsInPhase = [];
    // --- END KEY CHANGE ---

    let pathResult;
    // Find all paths in the current level graph (a "blocking flow")
    while (
      (pathResult = findPathAndFlow(
        residualGraph,
        source,
        sink,
        levels,
        Infinity,
      ))
    ) {
      const { path, pathFlow } = pathResult;
      phaseTotalFlow += pathFlow; // Add to phase total
      pathsInPhase.push(path); // Store the path

      // Update cumulative flows for visualization
      const newCumulativeFlows = { ...cumulativeFlows };
      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i];
        const v = path[i + 1];
        const edgeId = `${u}-${v}`;
        const reverseEdgeId = `${v}-${u}`;

        const reverseEdgeExists = edges.some(e => e.source === v && e.target === u);

        if (reverseEdgeExists && newCumulativeFlows[reverseEdgeId] > 0) {
          const flowToReturn = Math.min(newCumulativeFlows[reverseEdgeId], pathFlow);
          newCumulativeFlows[reverseEdgeId] -= flowToReturn;
        } else {
          newCumulativeFlows[edgeId] = (newCumulativeFlows[edgeId] || 0) + pathFlow;
        }
      }
      cumulativeFlows = newCumulativeFlows;

      // --- KEY CHANGE: DO NOT PUSH A STEP HERE ---
    }

    // --- KEY CHANGE: Push ONE step for the entire phase ---
    if (phaseTotalFlow > 0) {
      steps.push({
        // 'path' will now be an *array of paths*
        // We will need to update App.jsx to handle this
        path: pathsInPhase, 
        pathFlow: phaseTotalFlow,
        description: `Phase ${phase}: Found a blocking flow of ${phaseTotalFlow} via ${pathsInPhase.length} path(s).`,
        edgeFlows: { ...cumulativeFlows },
      });
    }
    // --- END KEY CHANGE ---
    
    phase++; // Move to the next phase
  }

  steps.push({
    path: [], // Empty, as before
    pathFlow: 0,
    description: `No more augmenting paths found. Algorithm terminates.`,
    edgeFlows: { ...cumulativeFlows },
  });

  return steps;
}