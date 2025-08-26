import React, { useState } from "react";
import { MdArrowRightAlt, MdOutlineCircle } from "react-icons/md";
import { FaMinus } from "react-icons/fa";
import { CiUnlock, CiLocationArrow1 } from "react-icons/ci";
import { FaRegHandPaper } from "react-icons/fa";
import { FaRegSquare } from "react-icons/fa6";
import { LuTriangle, LuPencil, LuEraser } from "react-icons/lu";
import { RiFontColor } from "react-icons/ri";
import { IoImageOutline } from "react-icons/io5";
import { LuRectangleHorizontal } from "react-icons/lu";
import { LuDiamond } from "react-icons/lu";
import "./Topbar.css";

export default function Topbar({ onToolSelect }) {
  const [activeTool, setActiveTool] = useState("select");

  const handleSelect = (tool) => {
    setActiveTool(tool);
    onToolSelect(tool);
  };

  return (
    <div className="topbar-wrapper">
      <div className="top-toolbar always-visible">
        {/* <button
          className={activeTool === "lock" ? "active" : ""}
          onClick={() => handleSelect("lock")}
        >
          <CiUnlock />
        </button> */}
        <button
          className={activeTool === "hand" ? "active" : ""}
          onClick={() => handleSelect("hand")}
        >
          <FaRegHandPaper />
        </button>

        <div className="vertical-divider" />

        <button
          className={activeTool === "square" ? "active" : ""}
          onClick={() => handleSelect("square")}
        >
          <FaRegSquare />
        </button>
        <button
          className={activeTool === "rectangle" ? "active" : ""}
          onClick={() => handleSelect("rectangle")}
        >
          <LuRectangleHorizontal />
        </button>
        <button
          className={activeTool === "diamond" ? "active" : ""}
          onClick={() => handleSelect("diamond")}
        >
          <LuDiamond />
        </button>
        <button
          className={activeTool === "circle" ? "active" : ""}
          onClick={() => handleSelect("circle")}
        >
          <MdOutlineCircle />
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
          <LuPencil />
        </button>
        <button
          className={activeTool === "text" ? "active" : ""}
          onClick={() => handleSelect("text")}
        >
          <RiFontColor />
        </button>
        <button
          className={activeTool === "image" ? "active" : ""}
          onClick={() => handleSelect("image")}
        >
          <IoImageOutline />
        </button>
        <button
          className={activeTool === "eraser" ? "active" : ""}
          onClick={() => handleSelect("eraser")}
        >
          <LuEraser />
        </button>
      </div>
    </div>
  );
}
