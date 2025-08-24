import React, { useState } from "react";
import { MdLock, MdDiamond, MdArrowRightAlt } from "react-icons/md";
import {
  FaHandPaper,
  FaMousePointer,
  FaSquare,
  FaRegCircle,
  FaMinus,
  FaPencilAlt,
  FaFont,
  FaImage,
  FaEraser,
  FaMagic,
} from "react-icons/fa";
import "./Topbar.css";

export default function Topbar({ onToolSelect }) {
  const [activeTool, setActiveTool] = useState("select");
  const [open, setOpen] = useState(false);

  const handleSelect = (tool) => {
    setActiveTool(tool);
    onToolSelect(tool);
  };

  return (
    <div className="topbar-wrapper">
      {/* Toggle button (always visible at left) */}
      <button className="toggle-btn" onClick={() => setOpen(!open)}>
        <FaMagic size={18} />
      </button>

      {/* Toolbar (slides out horizontally) */}
      <div className={`toolbar ${open ? "open" : ""}`}>
        <button
          className={activeTool === "lock" ? "active" : ""}
          onClick={() => handleSelect("lock")}
        >
          <MdLock />
        </button>
        <button
          className={activeTool === "hand" ? "active" : ""}
          onClick={() => handleSelect("hand")}
        >
          <FaHandPaper />
        </button>
        <button
          className={activeTool === "select" ? "active" : ""}
          onClick={() => handleSelect("select")}
        >
          <FaMousePointer />
        </button>
        <button
          className={activeTool === "square" ? "active" : ""}
          onClick={() => handleSelect("square")}
        >
          <FaSquare />
        </button>
        <button
          className={activeTool === "diamond" ? "active" : ""}
          onClick={() => handleSelect("diamond")}
        >
          <MdDiamond />
        </button>
        <button
          className={activeTool === "circle" ? "active" : ""}
          onClick={() => handleSelect("circle")}
        >
          <FaRegCircle />
        </button>
        <button
          className={activeTool === "arrow" ? "active" : ""}
          onClick={() => handleSelect("arrow")}
        >
          <MdArrowRightAlt />
        </button>
        <button
          className={activeTool === "line" ? "active" : ""}
          onClick={() => handleSelect("line")}
        >
          <FaMinus />
        </button>
        <button
          className={activeTool === "pen" ? "active" : ""}
          onClick={() => handleSelect("pen")}
        >
          <FaPencilAlt />
        </button>
        <button
          className={activeTool === "text" ? "active" : ""}
          onClick={() => handleSelect("text")}
        >
          <FaFont />
        </button>
        <button
          className={activeTool === "image" ? "active" : ""}
          onClick={() => handleSelect("image")}
        >
          <FaImage />
        </button>
        <button
          className={activeTool === "eraser" ? "active" : ""}
          onClick={() => handleSelect("eraser")}
        >
          <FaEraser />
        </button>
      </div>
    </div>
  );
}
