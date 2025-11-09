import React, { useMemo } from 'react';
import './AnalysisDisplay.css'; // New CSS for this component

// Helper component for the report cards
const ReportCard = ({ title, stats, analysis }) => (
  <div className={`analysis-card ${analysis.isWinner ? 'winner' : ''}`}>
    <h4>{title}</h4>
    <p className={`analysis-text ${analysis.isGood ? 'good' : 'bad'}`}>
      {analysis.text}
    </p>
    <ul className="analysis-stats">
      <li>Time: <strong>{stats.time.toFixed(4)} ms</strong></li>
      {analysis.opText && <li>{analysis.opText}</li>}
    </ul>
  </div>
);

// Main component
function AnalysisDisplay({ stats, graphProperties }) {

  // The "brains" of the analysis are in this useMemo hook
  const analysis = useMemo(() => {
    if (!stats || !graphProperties) return null;

    const { numNodes, numEdges, density, isUnitGraph } = graphProperties;
    const { ff, dinic, pr } = stats;

    const densityPercent = (density * 100).toFixed(1);
    const isSparse = density < 0.2;
    const isDense = density > 0.6;

    const times = [
      { name: 'ff', time: ff.time },
      { name: 'dinic', time: dinic.time },
      { name: 'pr', time: pr.time },
    ].sort((a, b) => a.time - b.time);

    const winnerKey = times[0].name;
    let verdict = "";

    // --- Generate Analysis for each Algorithm ---
    
    // Ford-Fulkerson
    let ffAnalysis = {
      isWinner: winnerKey === 'ff',
      isGood: false,
      text: "",
      opText: `${ff.operationCount} paths found`
    };
    if (ff.operationCount > dinic.phases * 5 && ff.operationCount > 10) {
      ffAnalysis.text = "This graph is inefficient for Ford-Fulkerson. Its simple 'one path at a time' strategy required ${ff.operationCount} separate, expensive BFS runs. This is its classic weakness.";
      ffAnalysis.isGood = false;
    } else {
      ffAnalysis.text = "This graph is simple enough that FF's low-overhead strategy was effective. It didn't need a complex approach.";
      ffAnalysis.isGood = true;
    }
    if (winnerKey === 'ff') verdict = "Ford-Fulkerson won, likely because the graph was very simple and had few augmenting paths. The setup cost of the other algorithms wasn't worth it.";

    // Dinic's
    let dinicAnalysis = {
      isWinner: winnerKey === 'dinic',
      isGood: false,
      text: "",
      opText: `${dinic.phases} phase(s)`
    };
    if (dinic.phases < ff.operationCount / 2 || dinic.phases <= 2) {
      dinicAnalysis.text = "Dinic's performed very well. By batching all shortest paths into just ${dinic.phases} phase(s), it avoided the massive repeated work of Ford-Fulkerson.";
      dinicAnalysis.isGood = true;
    } else {
      dinicAnalysis.text = "Dinic's was likely held back by the graph structure. If paths are long and complex, finding a 'blocking flow' in each phase can still be expensive.";
      dinicAnalysis.isGood = false;
    }
    if (isUnitGraph) dinicAnalysis.text += " (This is a unit-capacity graph, a best-case for Dinic's!)";
    if (winnerKey === 'dinic') verdict = "Dinic's won by being the smartest path-finding algorithm. It found all the flow in just ${dinic.phases} 'phase(s)', which is far more efficient than FF's ${ff.operationCount} individual path searches.";

    // Push-Relabel
    let prAnalysis = {
      isWinner: winnerKey === 'pr',
      isGood: false,
      text: "",
      opText: `${pr.pushes} pushes, ${pr.relabels} relabels`
    };
    if (isDense) {
      prAnalysis.text = "This is a dense graph (${densityPercent}%). Path-finding (BFS/DFS) is very slow here. Push-Relabel's 'local' operations avoid this cost entirely, making it the clear winner.";
      prAnalysis.isGood = true;
    } else if (isSparse) {
      prAnalysis.text = "This is a sparse graph (${densityPercent}%). These are often worst-cases for Push-Relabel, as flow must be 'pushed' over long distances, requiring many inefficient 'relabel' operations (${pr.relabels}).";
      prAnalysis.isGood = false;
    } else {
      prAnalysis.text = "This graph (${densityPercent}% density) didn't especially favor Push-Relabel. Its performance is balanced, but it didn't outshine the path-based methods.";
      prAnalysis.isGood = true; // Neutral
    }
    if (winnerKey === 'pr') verdict = "Push-Relabel won. This graph is likely dense (${densityPercent}%), making path-finding very slow. PR's 'local' push/relabel strategy avoids this entirely and excels.";

    return { winner: winnerKey, ff: ffAnalysis, dinic: dinicAnalysis, pr: prAnalysis, verdict };

  }, [stats, graphProperties]);

  if (!analysis) {
    return (
      <div className="compare-analysis-area placeholder">
        Run an analysis to see the deep-dive report here.
      </div>
    );
  }

  return (
    <div className="compare-analysis-area">
      <div className="analysis-column">
        <h3>Graph Properties</h3>
        <ul className="analysis-stats">
          <li>Nodes: <strong>{graphProperties.numNodes}</strong></li>
          <li>Edges: <strong>{graphProperties.numEdges}</strong></li>
          <li>Density: <strong>{(graphProperties.density * 100).toFixed(2)}%</strong> 
            ({graphProperties.density > 0.5 ? 'Dense' : graphProperties.density < 0.2 ? 'Sparse' : 'Medium'})
          </li>
          <li>Unit Capacity: <strong>{graphProperties.isUnitGraph ? 'Yes' : 'No'}</strong></li>
        </ul>
        <h3>Final Verdict</h3>
        <p className="verdict-text">{analysis.verdict}</p>
      </div>
      <div className="analysis-column report-cards">
        <ReportCard title="Ford-Fulkerson" stats={stats.ff} analysis={analysis.ff} />
        <ReportCard title="Dinic's Algorithm" stats={stats.dinic} analysis={analysis.dinic} />
        <ReportCard title="Push-Relabel" stats={stats.pr} analysis={analysis.pr} />
      </div>
    </div>
  );
}

export default AnalysisDisplay;