import { useState, useRef, useEffect } from "react";
import "./Sidebar.css";
import logo from "../../assets/logo.svg";
import { RiMenu2Line } from "react-icons/ri";
import { FaRegFolderOpen } from "react-icons/fa";
import { MdOutlineSaveAlt } from "react-icons/md";
import { TiDownload } from "react-icons/ti";
import { GrGroup } from "react-icons/gr";
import { FiHelpCircle } from "react-icons/fi";
import { TbHttpDelete } from "react-icons/tb";
import { IoImageOutline } from "react-icons/io5"; // NEW: Import image icon
import CollaborationModal from '../CollaborationModal/CollaborationModal';
import { toast } from "react-toastify";

const Sidebar = ({
  onSaveCanvas,
  onExportImage,
  onResetCanvas,
  onShowHelp,
  socket,
  roomId,
  setRoomId,
  onImageClick // NEW: Add image click handler prop
}) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = () => {
    setOpen(!open);
  };

  const [user, setUser] = useState(null);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);

  // NEW: Handle image button click (same as Topbar)
  const handleImageClick = () => {
    if (onImageClick) {
      onImageClick(); // Trigger the Canvas image functionality
    }
    setOpen(false);
  };

  // Handle Save to... - Auto download as PNG
  const handleSave = async () => {
    try {
      if (onSaveCanvas) {
        await onSaveCanvas();
        toast.success('Canvas is downloaded.');
      }
    } catch (error) {
      // console.error('Save failed:', error);
      toast.error('Failed to save canvas. Please try again.');
    }
    setOpen(false);
  };

  // Handle Export image - Auto download as PNG
  const handleExport = async () => {
    try {
      if (onExportImage) {
        await onExportImage();
        // console.log('Image exported successfully!');
      }
    } catch (error) {
      // console.error('Export failed:', error);
      alert('Failed to export image. Please try again.');
    }
    setOpen(false);
  };

  // Handle Reset Canvas
  const handleResetCanvas = () => {
    if (confirm('Are you sure you want to reset the canvas? This will clear all content and cannot be undone.')) {
      if (onResetCanvas) {
        onResetCanvas();
      }
    }
    setOpen(false);
  };

  // Handle Help
  const handleHelp = () => {
    if (onShowHelp) {
      onShowHelp();
    }
    setOpen(false);
  };

  const handleShare = () => {
    setShowCollaborationModal(true);
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
      <img className="logo" src={logo} alt="LOGO" />
      <button className="menu-button" onClick={toggleMenu}>
        <RiMenu2Line />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="dropdown-menu">
          <ul>

            {/* NEW: Add image option */}
            <li onClick={handleImageClick}>
              <IoImageOutline />
              <span>Open Image</span>
            </li>

            <li onClick={handleSave}>
              <MdOutlineSaveAlt />
              <span>Save to...</span>
            </li>

            <li onClick={handleExport}>
              <TiDownload />
              <span>Export image...</span>
            </li>

            <li onClick={handleShare} style={{ color: "green", fontWeight: 400 }}>
              <GrGroup />
              <span>Live collaboration...</span>
            </li>

            <li onClick={handleHelp}>
              <FiHelpCircle />
              <span>Help</span>
            </li>

            <li onClick={handleResetCanvas} className="danger-item" style={{ color: "red", fontWeight: 400 }}>
              <TbHttpDelete />
              <span>Reset the canvas</span>
            </li>
          </ul>
        </div>
      )}

      {showCollaborationModal && (
        <CollaborationModal
          user={user}
          socket={socket}
          roomId={roomId}
          setRoomId={setRoomId}
          onClose={() => setShowCollaborationModal(false)}
        />
      )}
    </div>
  );
};

export default Sidebar;
