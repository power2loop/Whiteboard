// CollaborationModal.jsx
import React, { useState, useEffect } from "react";
import "./CollaborationModal.css";
import { IoCopyOutline, IoCheckmarkOutline, IoStopCircleOutline } from "react-icons/io5";

const CollaborationModal = ({ user, socket, roomId, setRoomId, onClose }) => {
  const [userName, setUserName] = useState(user?.displayName || "");
  const [copied, setCopied] = useState(false);
  const [collaborationStarted, setCollaborationStarted] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(roomId || "");

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleStartCollaboration = () => {
    // Generate room ID if not exists
    if (!currentRoomId) {
      const newRoomId = generateRoomId();
      setCurrentRoomId(newRoomId);
      setRoomId(newRoomId);
    }
    
    // Toggle collaboration state
    setCollaborationStarted(true);
    
    // Here you can add socket.io logic later
    console.log("Collaboration started!");
  };

  const handleStopCollaboration = () => {
    // Toggle collaboration state back
    setCollaborationStarted(false);
    
    // Clear room ID
    setCurrentRoomId("");
    setRoomId("");
    
    // Here you can add socket.io cleanup logic later
    console.log("Collaboration stopped!");
  };

  const copyLink = async () => {
    const collaborationLink = `${window.location.origin}${window.location.pathname}?room=${currentRoomId}`;
    
    try {
      await navigator.clipboard.writeText(collaborationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      const textArea = document.createElement('textarea');
      textArea.value = collaborationLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Auto-start if URL has room parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomFromUrl = urlParams.get('room');
    if (roomFromUrl && !collaborationStarted) {
      setCurrentRoomId(roomFromUrl);
      setRoomId(roomFromUrl);
      setCollaborationStarted(true);
    }
  }, []);

  return (
    <div className="collaboration-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="collaboration-modal">
        <div className="modal-header">
          <h2>Live collaboration</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="form-group">
            <label>Your name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Your name"
              className="name-input"
              disabled={collaborationStarted}
            />
          </div>

          <div className="form-group">
            <label>Link</label>
            <div className="link-container">
              <input
                type="text"
                value={currentRoomId || "Room will be generated when you start"}
                readOnly
                className="link-input"
              />
              <button 
                className="copy-btn" 
                onClick={copyLink}
                disabled={!currentRoomId}
              >
                {copied ? <IoCheckmarkOutline /> : <IoCopyOutline />}
                {copied ? "Copied!" : "Copy link"}
              </button>
            </div>
          </div>

          {collaborationStarted && (
            <div className="collaboration-status">
              <div className="status-indicator">
                <div className="status-dot active"></div>
                <span>Collaboration active</span>
              </div>
            </div>
          )}

          <div className="privacy-notice">
            <span className="lock-icon">🔒</span>
            <p>
              Don't worry, the session is end-to-end encrypted, and fully private. 
              Not even our server can see what you draw.
            </p>
          </div>

          <div className="session-info">
            <p>
              Stopping the session will disconnect you from the room, but you'll be able to continue 
              working with the scene, locally. Note that this won't affect other people, and they'll still be 
              able to collaborate on their version.
            </p>
          </div>
        </div>

        <div className="modal-actions">
          {collaborationStarted ? (
            <button className="stop-btn" onClick={handleStopCollaboration}>
              <IoStopCircleOutline />
              Stop session
            </button>
          ) : (
            <button 
              className="start-btn" 
              onClick={handleStartCollaboration}
              disabled={!userName.trim()}
            >
              Start Collaboration
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborationModal;
