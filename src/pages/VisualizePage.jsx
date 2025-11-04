import React, { useState, useMemo } from 'react'; // Removed unused useCallback
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './VisualizePage.css';
import { runFordFulkerson } from '../../utils/fordFulkerson'
import { runDinic } from '../../utils/dinic';
// --- KEY CHANGE: Import Push-Relabel ---
import { runPushRelabel } from '../../utils/pushRelabel';


const defaultGraphInput = `s,a,10
s,b,10
a,c,4
a,d,8
b,d,9
c,t,10
d,c,6
d,t,10`;

function VisualizePage() {
  const [userInput, setUserInput] = useState(defaultGraphInput);
  const [initialEdges, setInitialEdges] = useState([]);
  const [algorithmSteps, setAlgorithmSteps] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(-1);

  const [selectedAlgorithm, setSelectedAlgorithm] = useState('fordFulkerson');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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
      parsedEdges.push({
        id: `${source}-${target}`,
        source,
        target,
        data: { capacity, flow: 0 },
        markerEnd: { type: MarkerType.ArrowClosed },
      });
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
      // --- KEY CHANGE: Store originalLabel for resetting ---
      const label = id === 's' ? 's (Source)' : id === 't' ? 't (Sink)' : id.toUpperCase();
      return {
        id,
        position: { x, y },
        data: { label: label, originalLabel: label },
        type: id === 's' ? 'input' : id === 't' ? 'output' : 'default',
      };
      // --- END KEY CHANGE ---
    });
    
    const algoInputEdges = parsedEdges.map(e => ({...e.data, source: e.source, target: e.target}));
    let steps = [];

    switch (selectedAlgorithm) {
      case 'dinic':
        steps = runDinic(nodeIds, algoInputEdges, 's', 't');
        break;
      // --- KEY CHANGE: Add Push-Relabel case ---
      case 'pushRelabel':
        steps = runPushRelabel(nodeIds, algoInputEdges, 's', 't');
        break;
      case 'fordFulkerson':
      default:
        steps = runFordFulkerson(nodeIds, algoInputEdges, 's', 't');
        break;
    }
    // --- END KEY CHANGE ---

    setNodes(generatedNodes);
    setInitialEdges(parsedEdges);
    setAlgorithmSteps(steps);
  };

  // --- KEY CHANGE: This hook now ONLY updates NODES ---
  useMemo(() => {
    // This hook updates node labels/styles for Push-Relabel
    if (selectedAlgorithm === 'pushRelabel') {
      let stepData;
      if (currentStep >= 0 && currentStep < algorithmSteps.length) {
        stepData = algorithmSteps[currentStep];
      }

      setNodes(prevNodes => prevNodes.map(node => {
        // --- FIX 1: Check if stepData *and* stepData.nodeData exist ---
        const data = (stepData && stepData.nodeData) ? stepData.nodeData[node.id] : null;
        const originalLabel = node.data.originalLabel;
        
        if (!data || currentStep < 0) { // Before algo starts or on reset
          return { ...node, data: { ...node.data, label: originalLabel }, style: {} };
        }

        // Format excess: show '∞' for source at init, '0' for others
        let excessStr = data.excess;
        if (node.id === 's' && stepData.type === 'init') excessStr = '∞';
        if (data.excess < 0) excessStr = '0'; // Source excess becomes negative, show 0
        
        return {
          ...node,
          data: {
            ...node.data,
            label: `${originalLabel}\n(h: ${data.height}, e: ${excessStr})`
          },
          // Highlight the node being pushed from or relabeled
          style: node.id === stepData.activeNode ? 
                 { border: '3px solid #FF0072', background: '#fff0f0' } : 
                 {}
        };
      }));
      
    } else {
      // Reset nodes if switching *away* from push-relabel
      setNodes(prevNodes => prevNodes.map(node => ({
        ...node,
        data: { ...node.data, label: node.data.originalLabel },
        style: {}
      })));
    }
  }, [currentStep, algorithmSteps, setNodes, selectedAlgorithm]); // Added setNodes/selectedAlgorithm
  // --- END KEY CHANGE ---


  // --- KEY CHANGE: This hook now ONLY updates EDGES ---
  useMemo(() => {
    if (initialEdges.length === 0) {
      setEdges([]); 
      return;
    }

    let stepData;
    if (currentStep >= 0 && currentStep < algorithmSteps.length) {
      stepData = algorithmSteps[currentStep];
    } else {
      // Reset to initial state
      setEdges(initialEdges.map(e => ({...e, label: `0 / ${e.data.capacity}`, style: {}, animated: false})));
      return;
    }

    // --- PUSH-RELABEL LOGIC FOR EDGES ---
    if (selectedAlgorithm === 'pushRelabel') {
      const updatedEdges = initialEdges.map(edge => {
          const newEdge = { ...edge, style: {}, animated: false };
          // --- FIX 2: Check if stepData *and* stepData.edgeFlows exist ---
          const currentFlow = (stepData && stepData.edgeFlows) ? (stepData.edgeFlows[edge.id] || 0) : 0;
          newEdge.label = `${currentFlow} / ${edge.data.capacity}`;
          newEdge.style = (currentFlow === edge.data.capacity) ? { stroke: '#cccccc' } : {};
          
          // Highlight the edge being pushed
          // --- FIX 3: Check if stepData exists before accessing pushEdge ---
          if (stepData && edge.id === stepData.pushEdge) {
              newEdge.style = { ...newEdge.style, stroke: '#FF0072', strokeWidth: 3 };
              newEdge.animated = true;
          }
          newEdge.markerEnd = { type: MarkerType.ArrowClosed };
          return newEdge;
      });
      setEdges(updatedEdges);
    } 
    // --- PATH-BASED LOGIC FOR EDGES ---
    else {
      const updatedEdges = initialEdges.map(edge => {
        const newEdge = { ...edge, style: {}, animated: false };
        // We can safely assume edgeFlows exists for path-based algos
        const currentFlow = stepData ? (stepData.edgeFlows[edge.id] || 0) : 0;
        newEdge.label = `${currentFlow} / ${edge.data.capacity}`;
        
        if (stepData?.path.length > 0) {
          const isPhase = Array.isArray(stepData.path[0]);
          if (isPhase) {
            for (const path of stepData.path) {
              for (let i = 0; i < path.length - 1; i++) {
                if (newEdge.source === path[i] && newEdge.target === path[i+1]) {
                  newEdge.style = { stroke: '#FF0072', strokeWidth: 3 };
                  newEdge.animated = true;
                }
              }
            }
          } else {
            const path = stepData.path;
            for (let i = 0; i < path.length - 1; i++) {
              if (newEdge.source === path[i] && newEdge.target === path[i+1]) {
                newEdge.style = { stroke: '#FF0072', strokeWidth: 3 };
                newEdge.animated = true;
              }
            }
          }
        }

        if (currentFlow === edge.data.capacity) {
          newEdge.style = { ...newEdge.style, stroke: '#cccccc' };
        }
        newEdge.markerEnd = { type: MarkerType.ArrowClosed };
        return newEdge;
      });
      setEdges(updatedEdges);
    }
  }, [currentStep, initialEdges, algorithmSteps, setEdges, selectedAlgorithm]); // Added selectedAlgorithm
  // --- END KEY CHANGE ---


  const maxFlow = useMemo(() => {
    if (currentStep < 0 || algorithmSteps.length === 0) return 0;
    const currentStepData = algorithmSteps[currentStep];
    if (!currentStepData || !currentStepData.edgeFlows) return 0; // Defensive check
    
    // This calculation works for all algorithms
    return initialEdges
        .filter(e => e.source === 's')
        .reduce((sum, e) => sum + (currentStepData.edgeFlows[e.id] || 0), 0);
  }, [currentStep, algorithmSteps, initialEdges]);

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, algorithmSteps.length - 1));
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, -1));
  const handleReset = () => setCurrentStep(-1);
  
  const currentStepInfo = (currentStep >= 0 && algorithmSteps.length > 0) ? algorithmSteps[currentStep] : { description: "Generate a graph or load the default to begin." };

  return (
    <div className="app-container">
      <header className="header">
        <h1>Max-Flow Algorithm Visualization 💡</h1>
        <p>Compare max-flow algorithms step-by-step.</p>
      </header>
      <div className="main-content">
        <div className="graph-container">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
          >
            <MiniMap />
            <Controls />
            <Background />
          </ReactFlow>
        </div>
        <div className="controls-container">
          
          <h2>Algorithm</h2>
          <select 
            value={selectedAlgorithm} 
            onChange={(e) => setSelectedAlgorithm(e.target.value)}
          >
            <option value="fordFulkerson">Ford-Fulkerson (BFS)</option>
            <option value="dinic">Dinic's Algorithm</option>
            {/* --- KEY CHANGE: Add Push-Relabel --- */}
            <option value="pushRelabel">Push-Relabel</option>
            {/* --- END KEY CHANGE --- */}
          </select>
          
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

export default VisualizePage;