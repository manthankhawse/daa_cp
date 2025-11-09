import React, { useState, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './VisualizePage.css'; // We will update this CSS
import { runFordFulkerson } from '../../utils/fordFulkerson';
import { runDinic } from '../../utils/dinic';
import { runPushRelabel } from '../../utils/pushRelabel';

const presetGraphs = {
  "default": `s,a,10
s,b,10
a,c,4
a,d,8
b,d,9
c,t,10
d,c,6
d,t,10`,
  "ff-worst-case": `s,a,1000000
s,b,1000000
a,b,1
a,t,1000000
b,t,1000000`,
  "dense-graph": `s,a,10
s,b,10
s,c,10
a,d,5
a,e,5
b,d,5
b,e,5
c,d,5
c,e,5
d,t,15
e,t,15`,
};

// (AlgorithmContext and LiveStats components remain identical to before)
const AlgorithmContext = ({ algorithm }) => {
  const content = useMemo(() => {
    switch (algorithm) {
      case 'fordFulkerson':
        return {
          title: 'Ford-Fulkerson (BFS)',
          description: 'Strategy: Finds one augmenting path at a time using a Breadth-First Search (BFS). It looks for the "shortest" path (by edge count) in the residual graph.'
        };
      case 'dinic':
        return {
          title: 'Dinic\'s Algorithm',
          description: 'Strategy: A faster, "batched" approach. It works in phases, finding *all* shortest paths at once using a "Level Graph" and then finding a "Blocking Flow".'
        };
      case 'pushRelabel':
        return {
          title: 'Push-Relabel',
          description: 'Strategy: A "local" algorithm. It floods the graph from the source and "pushes" flow downhill based on node "heights". It doesn\'t find paths at all.'
        };
      default:
        return {};
    }
  }, [algorithm]);

  return (
    <div className="info-box algo-context">
      <h3>{content.title}</h3>
      <p>{content.description}</p>
    </div>
  );
};

const LiveStats = ({ steps, currentStep, algorithm }) => {
  const stats = useMemo(() => {
    const stepsSoFar = steps.slice(0, currentStep + 1);
    if (stepsSoFar.length === 0) return null;

    if (algorithm === 'fordFulkerson') {
      return (
        <li><strong>Augmenting Paths:</strong> {stepsSoFar.length}</li>
      );
    }
    
    if (algorithm === 'dinic') {
      const lastStep = stepsSoFar[stepsSoFar.length - 1];
      const phase = lastStep?.description.match(/Phase (\d+)/)?.[1] || 1;
      return (
        <>
          <li><strong>Current Phase:</strong> {phase}</li>
          <li><strong>Total Paths Found:</strong> {stepsSoFar.length}</li>
        </>
      );
    }

    if (algorithm === 'pushRelabel') {
      const pushes = stepsSoFar.filter(s => s.type === 'push').length;
      const relabels = stepsSoFar.filter(s => s.type === 'relabel').length;
      return (
        <>
          <li><strong>Total Pushes:</strong> {pushes}</li>
          <li><strong>Total Relabels:</strong> {relabels}</li>
        </>
      );
    }
    return null;
  }, [steps, currentStep, algorithm]);

  if (!stats) return null;
  
  return (
    <div className="info-box live-stats">
      <h3>Live Statistics</h3>
      <ul>{stats}</ul>
    </div>
  );
};


function VisualizePage() {
  const [userInput, setUserInput] = useState(presetGraphs["default"]);
  const [initialEdges, setInitialEdges] = useState([]);
  const [algorithmSteps, setAlgorithmSteps] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(-1);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('fordFulkerson');
  const [selectedPreset, setSelectedPreset] = useState('default'); // Default preset

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // --- KEY UX CHANGE: Updated logic ---
  const handlePresetChange = (e) => {
    const presetName = e.target.value;
    setSelectedPreset(presetName);
    
    // If the user selects a preset, update the text and lock the box.
    if (presetName !== 'custom') {
      setUserInput(presetGraphs[presetName]);
    }
    // If they select "custom", the box is just unlocked. We don't change the text.
  };

  // --- KEY UX CHANGE: This handler is now much simpler ---
  const handleTextareaChange = (e) => {
    // This handler will only be called if the box is NOT readOnly
    // (i.e., selectedPreset is 'custom')
    setUserInput(e.target.value);
  };

  // (handleGenerateGraph and the useMemo/logic hooks are all unchanged)
  // ...
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
      const label = id === 's' ? 's (Source)' : id === 't' ? 't (Sink)' : id.toUpperCase();
      return {
        id,
        position: { x, y },
        data: { label: label, originalLabel: label },
        type: id === 's' ? 'input' : id === 't' ? 'output' : 'default',
      };
    });
    
    const algoInputEdges = parsedEdges.map(e => ({...e.data, source: e.source, target: e.target}));
    let steps = [];

    switch (selectedAlgorithm) {
      case 'dinic':
        steps = runDinic(nodeIds, algoInputEdges, 's', 't');
        break;
      case 'pushRelabel':
        steps = runPushRelabel(nodeIds, algoInputEdges, 's', 't');
        break;
      case 'fordFulkerson':
      default:
        steps = runFordFulkerson(nodeIds, algoInputEdges, 's', 't');
        break;
    }

    setNodes(generatedNodes);
    setInitialEdges(parsedEdges);
    setAlgorithmSteps(steps);
  };

  useMemo(() => {
    if (selectedAlgorithm === 'pushRelabel') {
      let stepData;
      if (currentStep >= 0 && currentStep < algorithmSteps.length) {
        stepData = algorithmSteps[currentStep];
      }
      setNodes(prevNodes => prevNodes.map(node => {
        const data = (stepData && stepData.nodeData) ? stepData.nodeData[node.id] : null;
        const originalLabel = node.data.originalLabel;
        if (!data || currentStep < 0) {
          return { ...node, data: { ...node.data, label: originalLabel }, style: {} };
        }
        let excessStr = data.excess;
        if (node.id === 's' && stepData.type === 'init') excessStr = '∞';
        if (data.excess < 0) excessStr = '0';
        return {
          ...node,
          data: {
            ...node.data,
            label: `${originalLabel}\n(h: ${data.height}, e: ${excessStr})`
          },
          style: node.id === stepData.activeNode ? 
                 { border: '3px solid #FF0072', background: '#fff0f0' } : 
                 {}
        };
      }));
    } else {
      setNodes(prevNodes => prevNodes.map(node => ({
        ...node,
        data: { ...node.data, label: node.data.originalLabel },
        style: {}
      })));
    }
  }, [currentStep, algorithmSteps, setNodes, selectedAlgorithm]);

  useMemo(() => {
    if (initialEdges.length === 0) {
      setEdges([]); 
      return;
    }
    let stepData;
    if (currentStep >= 0 && currentStep < algorithmSteps.length) {
      stepData = algorithmSteps[currentStep];
    } else {
      setEdges(initialEdges.map(e => ({...e, label: `0 / ${e.data.capacity}`, style: {}, animated: false})));
      return;
    }
    if (selectedAlgorithm === 'pushRelabel') {
      const updatedEdges = initialEdges.map(edge => {
          const newEdge = { ...edge, style: {}, animated: false };
          const currentFlow = (stepData && stepData.edgeFlows) ? (stepData.edgeFlows[edge.id] || 0) : 0;
          newEdge.label = `${currentFlow} / ${edge.data.capacity}`;
          newEdge.style = (currentFlow === edge.data.capacity) ? { stroke: '#cccccc' } : {};
          if (stepData && edge.id === stepData.pushEdge) {
              newEdge.style = { ...newEdge.style, stroke: '#FF0072', strokeWidth: 3 };
              newEdge.animated = true;
          }
          newEdge.markerEnd = { type: MarkerType.ArrowClosed };
          return newEdge;
      });
      setEdges(updatedEdges);
    } else {
      const updatedEdges = initialEdges.map(edge => {
        const newEdge = { ...edge, style: {}, animated: false };
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
  }, [currentStep, initialEdges, algorithmSteps, setEdges, selectedAlgorithm]);

  const maxFlow = useMemo(() => {
    if (currentStep < 0 || algorithmSteps.length === 0) return 0;
    const currentStepData = algorithmSteps[currentStep];
    if (!currentStepData || !currentStepData.edgeFlows) return 0;
    return initialEdges
        .filter(e => e.source === 's')
        .reduce((sum, e) => sum + (currentStepData.edgeFlows[e.id] || 0), 0);
  }, [currentStep, algorithmSteps, initialEdges]);

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, algorithmSteps.length - 1));
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, -1));
  const handleReset = () => setCurrentStep(-1);
  
  const currentStepInfo = (currentStep >= 0 && algorithmSteps.length > 0) ? algorithmSteps[currentStep] : { description: "Generate a graph or load the default to begin." };
  const isFinished = currentStep === algorithmSteps.length - 1;

  return (
    <div className="viz-page-container">
      <div className="main-content">
        <div className="graph-container">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            proOptions={{ hideAttribution: true }}
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
            <option value="pushRelabel">Push-Relabel</option>
          </select>

          <AlgorithmContext algorithm={selectedAlgorithm} />
          
          <h2>Graph Input</h2>
          <select 
            className="preset-select" 
            value={selectedPreset} 
            onChange={handlePresetChange}
          >
            <option value="default">Classic Graph</option>
            <option value="ff-worst-case">FF Worst-Case</option>
            <option value="dense-graph">Dense Graph</option>
            <option value="custom">-- Custom Input --</option>
          </select>

          <div className="input-area">
            {/* --- KEY UX CHANGE: Hook up the <textarea> --- */}
            <textarea
              value={userInput}
              onChange={handleTextareaChange}
              readOnly={selectedPreset !== 'custom'}
              className={selectedPreset !== 'custom' ? 'locked' : ''}
              rows="8"
              placeholder="Enter edge list, e.g.&#10;s,a,10&#10;a,t,10"
            ></textarea>
            {/* --- END KEY UX CHANGE --- */}
            <button className="generate-btn" onClick={handleGenerateGraph}>Generate & Run</button>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </div>

          <h2>Controls & Information</h2>
          <div className="buttons">
            <button onClick={handlePrev} disabled={currentStep < 0}>Previous</button>
            <button onClick={handleNext} disabled={isFinished || algorithmSteps.length === 0}>Next</button>
            <button onClick={handleReset} disabled={algorithmSteps.length === 0}>Reset</button>
          </div>
          <div className="flow-box">
            <h3>Maximum Flow So Far</h3>
            <p className="flow-value">{maxFlow}</p>
          </div>
          <div className={`info-box step-info ${isFinished ? 'finished' : ''}`}>
            <h3>Step {currentStep < 0 ? 0 : currentStep + 1} / {algorithmSteps.length}</h3>
            <p>{currentStepInfo.description}</p>
          </div>

          {currentStep >= 0 && (
            <LiveStats 
              steps={algorithmSteps} 
              currentStep={currentStep} 
              algorithm={selectedAlgorithm} 
            />
          )}

        </div>
      </div>
    </div>
  );
}

export default VisualizePage;