import React, { useState, useRef, useEffect } from "react";
import "./Sidebar.css";
import logo from "../../assets/logo.svg";
import { RiMenu2Line } from "react-icons/ri";
import { FaRegFolderOpen } from "react-icons/fa";
import { MdOutlineSaveAlt } from "react-icons/md";
import { TiDownload } from "react-icons/ti";
import { GrGroup } from "react-icons/gr";
import { FiHelpCircle } from "react-icons/fi";
import { TbHttpDelete } from "react-icons/tb";


const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = () => {
    setOpen(!open);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="sidebar-container" ref={menuRef}>
      {/* Button */}
      <img className="logo" src={logo} alt="" />
      <button className="menu-button" onClick={toggleMenu}>
        <RiMenu2Line />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="dropdown-menu">
          <ul>
            <li><FaRegFolderOpen /><span>Open</span></li>
            <li><MdOutlineSaveAlt /><span>Save to...</span></li>
            <li><TiDownload /><span>Export image...</span></li>
            <li><GrGroup /><span>Live collaboration...</span></li>
            {/* <li><span>Command palette</span></li> */}
            {/* <li><span>Find on canvas</span></li> */}
            <li><FiHelpCircle /><span>Help</span></li>
            <li><TbHttpDelete /><span>Reset the canvas</span></li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
