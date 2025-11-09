import React from 'react';
import ReactDOM from 'react-dom';
import './FullScreenModal.css'; // New CSS for this component

function FullScreenModal(props) {
  const {
    onClose,
    onNext,
    onPrev,
    onReset,
    currentStepIndex,
    maxStep,
    isStepZero,
    isStepLast,
    isGraphLoaded,
    children, // This will be the <VisualizationInstance>
  } = props;

  // We use a Portal to render this at the root of the document
  // This avoids z-index issues
  return ReactDOM.createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* The Fullscreen <VisualizationInstance> goes here */}
        <div className="modal-viz-container">
          {children}
        </div>

        {/* --- Controls for the Modal --- */}
        <div className="modal-controls">
          <button onClick={onPrev} disabled={isStepZero}>
            Previous
          </button>
          <div className="modal-step-counter">
            Step {isStepZero ? 0 : currentStepIndex + 1}
          </div>
          <button 
            onClick={onNext} 
            disabled={!isGraphLoaded || isStepLast}
          >
            Next
          </button>
          <button 
            onClick={onReset} 
            disabled={!isGraphLoaded}
            className="modal-reset-btn"
          >
            Reset
          </button>
          <button onClick={onClose} className="modal-close-btn">
            Close
          </button>
        </div>

      </div>
    </div>,
    document.body // Render at the root
  );
}

export default FullScreenModal;