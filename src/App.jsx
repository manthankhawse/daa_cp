import React, { useState, useMemo, useCallback } from 'react'; // Import useCallback
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState, // 1. Import useNodesState
  useEdgesState, // 2. Import useEdgesState
  MarkerType,    // 3. Import MarkerType for arrows
} from 'reactflow';
import 'reactflow/dist/style.css';
import './App.css';
import { runFordFulkerson } from '../utils/fordFulkerson';

const defaultGraphInput = `s,a,10
s,b,10
a,c,4
a,d,8
b,d,9
c,t,10
d,c,6
d,t,10`;

function FordFulkersonViz() {
  const [userInput, setUserInput] = useState(defaultGraphInput);
  const [initialEdges, setInitialEdges] = useState([]);
  const [algorithmSteps, setAlgorithmSteps] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(-1);

  // --- KEY CHANGE: Use reactflow's state hooks ---
  // These hooks enable interactivity like dragging.
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  // --- END KEY CHANGE ---

  const handleGenerateGraph = () => {
    setAlgorithmSteps([]);
    setCurrentStep(-1);
    setErrorMessage('');

    const parsedEdges = [];
    const nodeSet = new Set();
    const lines = userInput.trim().split('\n');

    for (const line of lines) {
      const [source, target, capacityStr] = line.split(',').map(s => s.trim());
      const capacity = parseInt(capacityStr, 10);
      if (!source || !target || isNaN(capacity)) {
        setErrorMessage(`Invalid edge format: "${line}".`);
        return;
      }
      // --- KEY CHANGE: Add markerEnd for directed edges ---
      parsedEdges.push({
        id: `${source}-${target}`,
        source,
        target,
        data: { capacity, flow: 0 },
        markerEnd: { type: MarkerType.ArrowClosed }, // Add this for arrows
      });
      // --- END KEY CHANGE ---
      nodeSet.add(source);
      nodeSet.add(target);
    }
    
    if (!nodeSet.has('s') || !nodeSet.has('t')) {
      setErrorMessage('Graph must contain a source node "s" and a sink node "t".');
      return;
    }

    const nodeIds = Array.from(nodeSet);
    const generatedNodes = nodeIds.map((id) => {
      let x, y;
      if (id === 's') { x = 0; y = 150; }
      else if (id === 't') { x = 650; y = 150; }
      else {
        const otherNodes = nodeIds.filter(nid => nid !== 's' && nid !== 't');
        const nodeIndex = otherNodes.indexOf(id);
        const col = 1 + Math.floor(nodeIndex / 3);
        const row = nodeIndex % 3;
        x = 150 * col;
        y = 100 * row;
      }
      return {
        id,
        position: { x, y },
        data: { label: id === 's' ? 's (Source)' : id === 't' ? 't (Sink)' : id.toUpperCase() },
        type: id === 's' ? 'input' : id === 't' ? 'output' : 'default',
      };
    });

    const steps = runFordFulkerson(nodeIds, parsedEdges.map(e => ({...e.data, source: e.source, target: e.target})), 's', 't');

    // Use the setters from the hooks
    setNodes(generatedNodes);
    setInitialEdges(parsedEdges);
    setAlgorithmSteps(steps);
  };

  // --- KEY CHANGE: useMemo is now used to update the edges state via setEdges ---
  useMemo(() => {
    if (initialEdges.length === 0) {
      setEdges([]); // Clear edges if graph is reset
      return;
    }

    let stepData;
    if (currentStep >= 0 && currentStep < algorithmSteps.length) {
      stepData = algorithmSteps[currentStep];
    }

    const updatedEdges = initialEdges.map(edge => {
      const newEdge = { ...edge, style: {}, animated: false };
      const currentFlow = stepData ? (stepData.edgeFlows[edge.id] || 0) : 0;
      
      newEdge.label = `${currentFlow} / ${edge.data.capacity}`;
      
      if (stepData?.path.length > 0) {
        for (let i = 0; i < stepData.path.length - 1; i++) {
          if (newEdge.source === stepData.path[i] && newEdge.target === stepData.path[i+1]) {
            newEdge.style = { stroke: '#FF0072', strokeWidth: 3 };
            newEdge.animated = true;
          }
        }
      }

      if (currentFlow === edge.data.capacity) {
        newEdge.style = { ...newEdge.style, stroke: '#cccccc' };
      }
      
      // Ensure the arrow marker is always present
      newEdge.markerEnd = { type: MarkerType.ArrowClosed };

      return newEdge;
    });

    setEdges(updatedEdges); // Update the edges state for React Flow
  }, [currentStep, initialEdges, algorithmSteps, setEdges]);
  // --- END KEY CHANGE ---

  const maxFlow = useMemo(() => {
    if (currentStep < 0 || algorithmSteps.length === 0) return 0;
    return algorithmSteps
      .slice(0, currentStep + 1)
      .reduce((sum, step) => sum + step.pathFlow, 0);
  }, [currentStep, algorithmSteps]);

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, algorithmSteps.length - 1));
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, -1));
  const handleReset = () => setCurrentStep(-1);
  
  const currentStepInfo = (currentStep >= 0 && algorithmSteps.length > 0) ? algorithmSteps[currentStep] : { description: "Generate a graph or load the default to begin." };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Ford-Fulkerson Algorithm Visualization 💡</h1>
        <p>Enter an edge list and see the algorithm find the maximum flow step-by-step.</p>
      </header>
      <div className="main-content">
        <div className="graph-container">
          {/* --- KEY CHANGE: Pass the state handlers to ReactFlow --- */}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
          >
          {/* --- END KEY CHANGE --- */}
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
        </div>
        <div className="controls-container">
          <h2>Graph Input</h2>
          <div className="input-area">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              rows="10"
              placeholder="Enter edge list, e.g.&#10;s,a,10&#10;a,t,10"
            ></textarea>
            <button className="generate-btn" onClick={handleGenerateGraph}>Generate & Run</button>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </div>

          <h2>Controls & Information</h2>
          <div className="buttons">
            <button onClick={handlePrev} disabled={currentStep < 0}>Previous</button>
            <button onClick={handleNext} disabled={currentStep >= algorithmSteps.length - 1 || algorithmSteps.length === 0}>Next</button>
            <button onClick={handleReset} disabled={algorithmSteps.length === 0}>Reset</button>
          </div>
          <div className="info-box">
            <h3>Step {currentStep < 0 ? 0 : currentStep + 1} / {algorithmSteps.length}</h3>
            <p>{currentStepInfo.description}</p>
          </div>
          <div className="flow-box">
            <h3>Maximum Flow So Far</h3>
            <p className="flow-value">{maxFlow}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FordFulkersonViz;