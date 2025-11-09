import React, { useMemo } from 'react';
import ReactFlow, {
  useNodesState,
  useEdgesState,
  MarkerType,
  Background,
  MiniMap,
  Controls, // Import Controls
} from 'reactflow';
import 'reactflow/dist/style.css';
import './VisualizationInstance.css'; // We will update this

// (StatsDisplay component is unchanged)
const StatsDisplay = ({ stats, algorithmType }) => {
  if (!stats) return null;
  return (
    <div className="viz-stats-hud">
      <h4>Performance</h4>
      <ul>
        <li><strong>Max Flow:</strong> {stats.maxFlow}</li>
        <li><strong>Total Time:</strong> {stats.time.toFixed(4)} ms</li>
        {algorithmType === 'path' && (
          <>
            <li><strong>Paths Found:</strong> {stats.operationCount}</li>
            {stats.phases && <li><strong>Phases:</strong> {stats.phases}</li>}
          </>
        )}
        {algorithmType === 'push-relabel' && (
          <>
            <li><strong>Total Ops:</strong> {stats.operationCount}</li>
            <li><strong>Pushes:</strong> {stats.pushes}</li>
            <li><strong>Relabels:</strong> {stats.relabels}</li>
          </>
        )}
      </ul>
    </div>
  );
};


function VisualizationInstance(props) {
  const {
    title,
    algorithmType,
    allSteps,
    currentStepIndex,
    initialNodes,
    initialEdges,
    stats,
    // --- KEY CHANGE: New prop for mode ---
    mode = "compact", // "compact" or "fullscreen"
    onExpandClick, // Replaces onFocus
  } = props;

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const lastStepIndex = allSteps.length - 1;
  const safeStepIndex = Math.min(currentStepIndex, lastStepIndex);
  const stepData = (safeStepIndex >= 0) ? allSteps[safeStepIndex] : null;
  const isFinished = currentStepIndex >= lastStepIndex;

  // (All useMemo hooks for nodes and edges are identical and correct)
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
      setNodes(prevNodes => prevNodes.map(node => ({
        ...node,
        data: { ...node.data, label: node.data.originalLabel },
        style: {}
      })));
    }
  }, [safeStepIndex, allSteps, setNodes, algorithmType]);

  useMemo(() => {
    if (!initialEdges || initialEdges.length === 0) return;
    if (!stepData) {
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

  useMemo(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  const containerClasses = [
    'viz-instance-container',
    `mode-${mode}`, // "mode-compact" or "mode-fullscreen"
    isFinished ? 'finished' : '',
  ].join(' ');

  return (
    <div className={containerClasses}>
      <h3 className="viz-title">
        {title}
        {/* --- KEY CHANGE: Only show expand btn in compact mode --- */}
        {mode === 'compact' && (
          <button onClick={onExpandClick} className="viz-focus-btn" title="Expand">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          </button>
        )}
      </h3>

      <div className="viz-reactflow-wrapper">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          proOptions={{ hideAttribution: true }}
          // --- KEY CHANGE: Interactivity based on mode ---
          nodesDraggable={mode === 'fullscreen'}
          nodesConnectable={false}
          zoomOnScroll={mode === 'fullscreen'}
          panOnDrag={mode === 'fullscreen'}
        >
          <Background />
          <MiniMap pannable zoomable={mode === 'fullscreen'} />
          {/* Show controls only in fullscreen */}
          {mode === 'fullscreen' && <Controls />}
        </ReactFlow>
      </div>
      <div className="viz-info-bar">
        <div className="viz-info-box description">
          <span>Current Step ({Math.max(0, safeStepIndex + 1)} / {lastStepIndex + 1})</span>
          <p>{isFinished ? 'Finished' : (stepData?.description || 'Pending...')}</p>
        </div>
        <StatsDisplay stats={stats} algorithmType={algorithmType} />
      </div>
    </div>
  );
}

export default VisualizationInstance;