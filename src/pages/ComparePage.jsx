import React, { useState } from 'react';
import './ComparePage.css'; // We will update this file

// Import all three algorithm functions
import { runFordFulkerson } from '../../utils/fordFulkerson';
import { runDinic } from '../../utils/dinic';
import { runPushRelabel } from '../../utils/pushRelabel';

// Import our new reusable component
import VisualizationInstance from '../components/VisualizationInstance';

const defaultGraphInput = `s,a,16
s,b,13
a,b,10
a,c,12
b,a,4
b,d,14
c,b,9
c,t,20
d,c,7
d,t,4`;

function ComparePage() {
  const [userInput, setUserInput] = useState(defaultGraphInput);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- Master State ---
  // This holds the data for all 3 algos
  const [masterStepData, setMasterStepData] = useState(null);
  // This is the one and only step counter
  const [currentStep, setCurrentStep] = useState(-1);

  const handleGenerateGraph = () => {
    setIsLoading(true);
    setMasterStepData(null);
    setCurrentStep(-1);
    setErrorMessage('');

    // --- 1. Parse Input ---
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

    // --- 2. Generate Nodes ---
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

    // --- 3. Run All Algorithms ---
    // (Run in a timeout to let "Loading..." render)
    setTimeout(() => {
      try {
        const stepsFF = runFordFulkerson(nodeIds, algoInputEdges, 's', 't');
        const stepsDinic = runDinic(nodeIds, algoInputEdges, 's', 't');
        const stepsPR = runPushRelabel(nodeIds, algoInputEdges, 's', 't');

        setMasterStepData({
          stepsFF,
          stepsDinic,
          stepsPR,
          initialNodes: generatedNodes,
          initialEdges: parsedEdges,
        });
      } catch (error) {
        console.error("Analysis failed:", error);
        setErrorMessage("An error occurred during analysis.");
      }
      setIsLoading(false);
    }, 50);
  };

  // --- Master Step Controls ---
  const maxStep = masterStepData ? Math.max(
    masterStepData.stepsFF.length,
    masterStepData.stepsDinic.length,
    masterStepData.stepsPR.length
  ) - 1 : 0;

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, maxStep));
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, -1));
  const handleReset = () => setCurrentStep(-1);

  return (
    <div className="compare-page-container">
      
      {/* --- 1. The Input & Control Bar --- */}
      <div className="compare-controls-bar">
        <div className="compare-input-area">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            rows="8"
            placeholder="s,a,10&#10;a,t,10"
          />
          <button 
            className="compare-generate-btn" 
            onClick={handleGenerateGraph} 
            disabled={isLoading}
          >
            {isLoading ? "Running..." : "Generate & Run All"}
          </button>
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

      {/* --- 2. The Side-by-Side Visualization Area --- */}
      <div className="compare-viz-area">
        {!masterStepData && !isLoading && (
          <div className="viz-placeholder">
            <h2>Generate a graph to start the comparison.</h2>
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
            />
            <VisualizationInstance
              title="Dinic's Algorithm"
              algorithmType="path"
              allSteps={masterStepData.stepsDinic}
              currentStepIndex={currentStep}
              initialNodes={masterStepData.initialNodes}
              initialEdges={masterStepData.initialEdges}
            />
            <VisualizationInstance
              title="Push-Relabel"
              algorithmType="push-relabel"
              allSteps={masterStepData.stepsPR}
              currentStepIndex={currentStep}
              initialNodes={masterStepData.initialNodes}
              initialEdges={masterStepData.initialEdges}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default ComparePage;