import React from 'react';
import './BottomControls.css';

const BottomControls = () => {
  return (
    <div className='bottomcontrols-container'>
      <div className='control-group'>
        <button className='control-btn'>−</button>
        <span className='control-value'>100%</span>
        <button className='control-btn'>＋</button>
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
