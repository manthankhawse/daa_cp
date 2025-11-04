import React, { useMemo } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  MarkerType,
  Background,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import './VisualizationInstance.css'; // New CSS for this component

// Helper to get max flow from a step
const calculateMaxFlow = (stepData, initialEdges) => {
  if (!stepData || !stepData.edgeFlows) return 0;
  return initialEdges
    .filter(e => e.source === 's')
    .reduce((sum, e) => sum + (stepData.edgeFlows[e.id] || 0), 0);
};

function VisualizationInstance(props) {
  const {
    title,
    algorithmType,
    allSteps,
    currentStepIndex,
    initialNodes,
    initialEdges,
  } = props;

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Get the safe step data for this algorithm
  const lastStepIndex = allSteps.length - 1;
  const safeStepIndex = Math.min(currentStepIndex, lastStepIndex);
  const stepData = (safeStepIndex >= 0) ? allSteps[safeStepIndex] : null;
  const isFinished = currentStepIndex >= lastStepIndex;

  // --- This is the same logic from your main Visualizer! ---
  // 1. Hook to update NODES
  useMemo(() => {
    if (algorithmType === 'push-relabel') {
      setNodes(prevNodes => prevNodes.map(node => {
        const data = (stepData && stepData.nodeData) ? stepData.nodeData[node.id] : null;
        const originalLabel = node.data.originalLabel;
        
        if (!data) {
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
      // Reset nodes if not push-relabel
      setNodes(prevNodes => prevNodes.map(node => ({
        ...node,
        data: { ...node.data, label: node.data.originalLabel },
        style: {}
      })));
    }
  }, [safeStepIndex, allSteps, setNodes, algorithmType]); // Depends on this instance's step

  // 2. Hook to update EDGES
  useMemo(() => {
    if (!initialEdges || initialEdges.length === 0) return;

    if (!stepData) {
      // Reset to initial state
      setEdges(initialEdges.map(e => ({...e, label: `0 / ${e.data.capacity}`, style: {}, animated: false})));
      return;
    }

    if (algorithmType === 'push-relabel') {
      const updatedEdges = initialEdges.map(edge => {
          const newEdge = { ...edge, style: {}, animated: false };
          const currentFlow = stepData.edgeFlows[edge.id] || 0;
          newEdge.label = `${currentFlow} / ${edge.data.capacity}`;
          newEdge.style = (currentFlow === edge.data.capacity) ? { stroke: '#cccccc' } : {};
          if (edge.id === stepData.pushEdge) {
              newEdge.style = { ...newEdge.style, stroke: '#FF0072', strokeWidth: 3 };
              newEdge.animated = true;
          }
          newEdge.markerEnd = { type: MarkerType.ArrowClosed };
          return newEdge;
      });
      setEdges(updatedEdges);
    } else {
      // Path-based logic
      const updatedEdges = initialEdges.map(edge => {
        const newEdge = { ...edge, style: {}, animated: false };
        const currentFlow = stepData.edgeFlows[edge.id] || 0;
        newEdge.label = `${currentFlow} / ${edge.data.capacity}`;
        
        if (stepData.path && stepData.path.length > 0) {
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
  }, [safeStepIndex, allSteps, initialEdges, setEdges, algorithmType]);

  // 3. Hook to set initial nodes
  useMemo(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  const currentFlow = calculateMaxFlow(stepData, initialEdges);

  return (
    <div className={`viz-instance-container ${isFinished ? 'finished' : ''}`}>
      <h3 className="viz-title">{title}</h3>
      <div className="viz-reactflow-wrapper">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <MiniMap />
        </ReactFlow>
      </div>
      <div className="viz-info-bar">
        <div className="viz-info-box">
          <span>Max Flow</span>
          <p>{currentFlow}</p>
        </div>
        <div className="viz-info-box">
          <span>{algorithmType === 'path' ? 'Paths/Phases' : 'Operations'}</span>
          <p>{Math.max(0, safeStepIndex + 1)} / {lastStepIndex + 1}</p>
        </div>
        <div className="viz-info-box description">
          <span>Status</span>
          <p>{isFinished ? 'Finished' : (stepData?.description || 'Pending...')}</p>
        </div>
      </div>
    </div>
  );
}

export default VisualizationInstance;