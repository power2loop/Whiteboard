import React, { useState, useRef, useEffect } from "react";
import "./Sidebar.css";

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
      <button className="menu-button" onClick={toggleMenu}>
        ☰
      </button>

      {/* Dropdown */}
      {open && (
        <div className="dropdown-menu">
          <ul>
            <li>Open</li>
            <li>Save to...</li>
            <li>Export image...</li>
            <li className="highlight">Live collaboration...</li>
            <li className="command">Command palette</li>
            <li>Find on canvas</li>
            <li>Help</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
