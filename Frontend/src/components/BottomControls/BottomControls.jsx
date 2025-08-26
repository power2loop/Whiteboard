import { useState } from "react";
import './BottomControls.css';
import { HiOutlineMinus } from "react-icons/hi";
import { RxPlus } from "react-icons/rx";
import { BiUndo } from "react-icons/bi";
import { BiRedo } from "react-icons/bi";

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
        <button className="control-btn" onClick={decrease}><HiOutlineMinus /></button>
        <span className="control-value">{zoom}%</span>
        <button className="control-btn" onClick={increase}><RxPlus /></button>
      </div>
      <div className='control-group'>
        <button className='control-btn' aria-label='Undo'>
          <BiUndo />
        </button>
        <button className='control-btn' aria-label='Redo'>
          <BiRedo />
        </button>
      </div>
    </div>
  );
};

export default BottomControls;
