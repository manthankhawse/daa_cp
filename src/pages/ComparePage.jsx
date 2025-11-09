import React, { useState } from 'react';
import './ComparePage.css'; // We will update this

import { runFordFulkerson } from '../../utils/fordFulkerson';
import { runDinic } from '../../utils/dinic';
import { runPushRelabel } from '../../utils/pushRelabel';
import VisualizationInstance from '../components/VisualizationInstance';
import AnalysisDisplay from '../components/AnalysisDisplay';
// --- KEY ADDITION: Import the new modal component ---
import FullScreenModal from '../components/FullScreenModal';

const presetGraphs = {
  // (presetGraphs object is unchanged)
  "default": `s,a,16
s,b,13
a,b,10
a,c,12
b,a,4
b,d,14
c,b,9
c,t,20
d,c,7
d,t,4`,
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
  "long-chain": `s,a,10
a,b,10
b,c,10
c,d,10
d,t,10`,
};

// Helper to get all data for the expanded viz
const getExpandedVizData = (key, masterStepData) => {
  if (!key || !masterStepData) return null;
  switch (key) {
    case 'ff':
      return {
        title: "Ford-Fulkerson (BFS)",
        algorithmType: "path",
        allSteps: masterStepData.stepsFF,
        stats: masterStepData.stats.ff
      };
    case 'dinic':
      return {
        title: "Dinic's Algorithm",
        algorithmType: "path",
        allSteps: masterStepData.stepsDinic,
        stats: masterStepData.stats.dinic
      };
    case 'pr':
      return {
        title: "Push-Relabel",
        algorithmType: "push-relabel",
        allSteps: masterStepData.stepsPR,
        stats: masterStepData.stats.pr
      };
    default:
      return null;
  }
};


function ComparePage() {
  const [userInput, setUserInput] = useState(presetGraphs["default"]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [masterStepData, setMasterStepData] = useState(null);
  const [currentStep, setCurrentStep] = useState(-1);
  const [selectedPreset, setSelectedPreset] = useState('default');
  
  // --- KEY CHANGE: This state now controls the modal ---
  const [expandedViz, setExpandedViz] = useState(null); // null, 'ff', 'dinic', or 'pr'

  // (All handlers - handlePresetChange, handleTextareaChange, 
  //  calculateMaxFlow, handleGenerateGraph - are unchanged)
  const handlePresetChange = (e) => {
    const presetName = e.target.value;
    setSelectedPreset(presetName);
    if (presetName !== 'custom') {
      setUserInput(presetGraphs[presetName]);
    }
    setMasterStepData(null);
    setCurrentStep(-1);
  };

  const handleTextareaChange = (e) => {
    setUserInput(e.target.value);
    setSelectedPreset('custom');
  };

  const calculateMaxFlow = (finalStep, initialEdges) => {
    if (!finalStep || !finalStep.edgeFlows) return 0;
    return initialEdges
      .filter(e => e.source === 's')
      .reduce((sum, e) => sum + (finalStep.edgeFlows[e.id] || 0), 0);
  };

  const handleGenerateGraph = () => {
    setIsLoading(true);
    setMasterStepData(null);
    setCurrentStep(-1);
    setErrorMessage('');
    setExpandedViz(null); // Reset focus

    // ... (rest of the parsing/running logic is identical) ...
    const parsedEdges = [];
    const nodeSet = new Set();
    const lines = userInput.trim().split('\n');
    for (const line of lines) {
      const [source, target, capacityStr] = line.split(',').map(s => s.trim());
      const capacity = parseInt(capacityStr, 10);
      if (!source || !target || isNaN(capacity)) {
        setErrorMessage(`Invalid edge format: "${line}".`);
        setIsLoading(false);
        return;
      }
      parsedEdges.push({
        id: `${source}-${target}`,
        source,
        target,
        data: { capacity, flow: 0 },
      });
      nodeSet.add(source);
      nodeSet.add(target);
    }
    if (!nodeSet.has('s') || !nodeSet.has('t')) {
      setErrorMessage('Graph must contain "s" and "t".');
      setIsLoading(false);
      return;
    }
    const nodeIds = Array.from(nodeSet);
    const algoInputEdges = parsedEdges.map(e => ({ ...e.data, source: e.source, target: e.target }));

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

    setTimeout(() => {
      try {
        const stats = {};
        const graphProperties = {
          numNodes: nodeIds.length,
          numEdges: parsedEdges.length,
          density: parsedEdges.length / (nodeIds.length * (nodeIds.length - 1)),
          isUnitGraph: algoInputEdges.every(e => e.capacity === 1),
        };

        let start = performance.now();
        const stepsFF = runFordFulkerson(nodeIds, algoInputEdges, 's', 't');
        let end = performance.now();
        stats.ff = {
          time: end - start,
          maxFlow: calculateMaxFlow(stepsFF[stepsFF.length - 1], parsedEdges),
          operationCount: stepsFF.length - 1,
        };

        start = performance.now();
        const stepsDinic = runDinic(nodeIds, algoInputEdges, 's', 't');
        end = performance.now();
        const dinicPhases = new Set(stepsDinic.slice(0, -1).map(s => s.description.match(/Phase (\d+)/)?.[1])).size;
        stats.dinic = {
          time: end - start,
          maxFlow: calculateMaxFlow(stepsDinic[stepsDinic.length - 1], parsedEdges),
          operationCount: stepsDinic.length - 1,
          phases: dinicPhases || 1,
        };

        start = performance.now();
        const stepsPR = runPushRelabel(nodeIds, algoInputEdges, 's','t');
        end = performance.now();
        stats.pr = {
          time: end - start,
          maxFlow: calculateMaxFlow(stepsPR[stepsPR.length - 1], parsedEdges),
          operationCount: stepsPR.length - 1,
          pushes: stepsPR.filter(s => s.type === 'push').length,
          relabels: stepsPR.filter(s => s.type === 'relabel').length,
        };

        setMasterStepData({
          stepsFF,
          stepsDinic,
          stepsPR,
          initialNodes: generatedNodes,
          initialEdges: parsedEdges,
          stats: stats,
          graphProperties: graphProperties,
        });
        
      } catch (error) {
        console.error("Analysis failed:", error);
        setErrorMessage("An error occurred during analysis.");
      }
      setIsLoading(false);
    }, 50);
  };


  const maxStep = masterStepData ? Math.max(
    masterStepData.stepsFF.length,
    masterStepData.stepsDinic.length,
    masterStepData.stepsPR.length
  ) - 1 : 0;

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, maxStep));
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, -1));
  const handleReset = () => setCurrentStep(-1);

  // --- KEY: Get the data for the currently expanded modal ---
  const expandedVizData = getExpandedVizData(expandedViz, masterStepData);

  return (
    <div className="compare-page-container">
      
      <div className="compare-controls-bar">
        <div className="compare-input-area">
          <textarea
            value={userInput}
            onChange={handleTextareaChange}
            readOnly={selectedPreset !== 'custom'}
            className={selectedPreset !== 'custom' ? 'locked' : ''}
            rows="8"
            placeholder="s,a,10&#10;a,t,10"
          />
          <div className="input-buttons">
            <button 
              className="compare-generate-btn" 
              onClick={handleGenerateGraph} 
              disabled={isLoading}
            >
              {isLoading ? "Running..." : "Generate & Run All"}
            </button>
            <select 
              className="preset-select" 
              value={selectedPreset} 
              onChange={handlePresetChange}
            >
              <option value="default">Classic Graph</option>
              <option value="ff-worst-case">FF Worst-Case</option>
              <option value="dense-graph">Dense Graph</option>
              <option value="long-chain">Long Chain</option>
              <option value="custom">-- Custom Input --</option>
            </select>
          </div>
        </div>
        <div className="compare-step-controls">
          <button onClick={handlePrev} disabled={currentStep < 0}>
            Previous
          </button>
          <div className="step-counter">
            Step {currentStep < 0 ? 0 : currentStep + 1}
          </div>
          <button 
            onClick={handleNext} 
            disabled={!masterStepData || currentStep >= maxStep}
          >
            Next
          </button>
          <button 
            onClick={handleReset} 
            disabled={!masterStepData}
            className="reset-btn"
          >
            Reset
          </button>
        </div>
        {errorMessage && <p className="compare-error-msg">{errorMessage}</p>}
      </div>

      <div className="compare-viz-area">
        {!masterStepData && !isLoading && (
          <div className="viz-placeholder">
            <h2>Select a preset or paste a graph to start.</h2>
          </div>
        )}
        {isLoading && (
          <div className="viz-placeholder">
            <h2>Running all algorithms...</h2>
          </div>
        )}
        {masterStepData && (
          <>
            <VisualizationInstance
              title="Ford-Fulkerson (BFS)"
              algorithmType="path"
              allSteps={masterStepData.stepsFF}
              currentStepIndex={currentStep}
              initialNodes={masterStepData.initialNodes}
              initialEdges={masterStepData.initialEdges}
              stats={masterStepData.stats.ff}
              onExpandClick={() => setExpandedViz('ff')}
              mode="compact"
            />
            <VisualizationInstance
              title="Dinic's Algorithm"
              algorithmType="path"
              allSteps={masterStepData.stepsDinic}
              currentStepIndex={currentStep}
              initialNodes={masterStepData.initialNodes}
              initialEdges={masterStepData.initialEdges}
              stats={masterStepData.stats.dinic}
              onExpandClick={() => setExpandedViz('dinic')}
              mode="compact"
            />
            <VisualizationInstance
              title="Push-Relabel"
              algorithmType="push-relabel"
              allSteps={masterStepData.stepsPR}
              currentStepIndex={currentStep}
              initialNodes={masterStepData.initialNodes}
              initialEdges={masterStepData.initialEdges}
              stats={masterStepData.stats.pr}
              onExpandClick={() => setExpandedViz('pr')}
              mode="compact"
            />
          </>
        )}
      </div>

      <AnalysisDisplay 
        stats={masterStepData?.stats}
        graphProperties={masterStepData?.graphProperties}
      />

      {/* --- KEY ADDITION: Render the Full Screen Modal --- */}
      {expandedViz && expandedVizData && (
        <FullScreenModal
          onClose={() => setExpandedViz(null)}
          onNext={handleNext}
          onPrev={handlePrev}
          onReset={handleReset}
          currentStepIndex={currentStep}
          maxStep={maxStep}
          isStepZero={currentStep < 0}
          isStepLast={currentStep >= maxStep}
          isGraphLoaded={!!masterStepData}
        >
          <VisualizationInstance
            title={expandedVizData.title}
            algorithmType={expandedVizData.algorithmType}
            allSteps={expandedVizData.allSteps}
            currentStepIndex={currentStep}
            initialNodes={masterStepData.initialNodes}
            initialEdges={masterStepData.initialEdges}
            stats={expandedVizData.stats}
            mode="fullscreen"
          />
        </FullScreenModal>
      )}
      {/* --- END KEY ADDITION --- */}

    </div>
  );
}

export default ComparePage;