import { useState } from "react";
import './BottomControls.css';

const BottomControls = () => {
  const [zoom, setZoom] = useState(100);

  const decrease = () => {
    if (zoom > 10) setZoom(zoom - 10); // prevent going below 10%
  };

  const increase = () => {
    if (zoom < 500) setZoom(zoom + 10); // prevent going above 500%
  };

  return (
    <div className='bottomcontrols-container'>
      <div className="control-group">
        <button className="control-btn" onClick={decrease}>−</button>
        <span className="control-value">{zoom}%</span>
        <button className="control-btn" onClick={increase}>＋</button>
      </div>
      <div className='control-group'>
        <button className='control-btn' aria-label='Undo'>
          &#8630;
        </button>
        <button className='control-btn' aria-label='Redo'>
          &#8631;
        </button>
      </div>
    </div>
  );
};

export default BottomControls;
