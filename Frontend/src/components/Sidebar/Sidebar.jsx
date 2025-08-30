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

const Sidebar = ({
  onOpenFile,
  onSaveCanvas,
  onExportImage,
  onResetCanvas,
  onShowHelp
}) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  const toggleMenu = () => {
    setOpen(!open);
  };

  // Handle Open functionality - Updated to support both JSON and images
  const handleOpen = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json,image/*'; // Accept both JSON and image files
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        // Check if it's an image file
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (onOpenFile) {
              onOpenFile({
                type: 'image',
                src: event.target.result,
                name: file.name
              });
            }
          };
          reader.readAsDataURL(file);
        }
        // Check if it's a JSON file
        else if (file.type === 'application/json' || file.name.endsWith('.json')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            try {
              const canvasData = JSON.parse(event.target.result);
              if (onOpenFile) {
                onOpenFile({
                  type: 'canvas',
                  data: canvasData
                });
              }
            } catch (error) {
              console.error('Error parsing JSON file:', error);
              alert('Invalid JSON file format. Please select a valid canvas file.');
            }
          };
          reader.readAsText(file);
        }
        else {
          alert('Please select a valid image file or JSON canvas file.');
        }
      }
    };
    fileInput.click();
    setOpen(false);
  };

  // Handle Save to... - Auto download as PNG
  const handleSave = async () => {
    try {
      if (onSaveCanvas) {
        await onSaveCanvas();
        console.log('Canvas saved successfully!');
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save canvas. Please try again.');
    }
    setOpen(false);
  };

  // Handle Export image - Auto download as PNG
  const handleExport = async () => {
    try {
      if (onExportImage) {
        await onExportImage();
        console.log('Image exported successfully!');
      }
    } catch (error) {
      console.error('Export failed:', error);
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

  // Handle Live Collaboration (placeholder)
  const handleLiveCollaboration = () => {
    alert('Live collaboration feature coming soon!');
    setOpen(false);
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
            <li onClick={handleOpen}>
              <FaRegFolderOpen />
              <span>Open</span>
            </li>

            <li onClick={handleSave}>
              <MdOutlineSaveAlt />
              <span>Save to...</span>
            </li>

            <li onClick={handleExport}>
              <TiDownload />
              <span>Export image...</span>
            </li>

            <li onClick={handleLiveCollaboration}>
              <GrGroup />
              <span>Live collaboration...</span>
            </li>

            <li onClick={handleHelp}>
              <FiHelpCircle />
              <span>Help</span>
            </li>

            <li onClick={handleResetCanvas} className="danger-item">
              <TbHttpDelete />
              <span>Reset the canvas</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
