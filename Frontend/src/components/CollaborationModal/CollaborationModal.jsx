import React, { useState, useEffect } from "react";
import { IoCopyOutline, IoCheckmarkOutline, IoStopCircleOutline } from "react-icons/io5";
import './CollaborationModal.css';
import { toast } from "react-toastify";

const CollaborationModal = ({ user, socket, roomId, setRoomId, onClose }) => {
  const [userName, setUserName] = useState(user?.displayName || "");
  const [copied, setCopied] = useState(false);
  const [collaborationStarted, setCollaborationStarted] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState(roomId || "");
  const [isConnecting, setIsConnecting] = useState(false);

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleStartCollaboration = () => {
    if (isConnecting) return;

    setIsConnecting(true);

    // Generate room ID if not exists
    let newRoomId = currentRoomId;
    if (!newRoomId) {
      newRoomId = generateRoomId();
      setCurrentRoomId(newRoomId);
      setRoomId(newRoomId);
    }

    // Join room via socket
    if (socket) {
      socket.emit('joinRoom', {
        roomId: newRoomId,
        userInfo: {
          userId: user?.uid || socket.id,
          name: user?.displayName || userName || `User ${socket.id?.slice(0, 6)}`,
          color: "#000000"
        }
      });

      // Update URL
      const newUrl = `${window.location.origin}${window.location.pathname}?room=${newRoomId}`;
      window.history.pushState(null, '', newUrl);
    }

    setCollaborationStarted(true);
    setIsConnecting(false);
    toast.success(`Collaboration started ${user.displayName}.`);
  };

  const handleStopCollaboration = () => {
    // Leave room via socket
    if (socket && currentRoomId) {
      socket.emit('leaveRoom');
    }

    // Clear states
    setCollaborationStarted(false);
    setCurrentRoomId("");
    setRoomId("");

    // Clear URL
    window.history.pushState(null, '', window.location.pathname);

    toast.warning(`Collaboration stopped by ${user.displayName}`);
  };

  const copyLink = async () => {
    const collaborationLink = `${window.location.origin}${window.location.pathname}?room=${currentRoomId}`;

    try {
      await navigator.clipboard.writeText(collaborationLink);
      setCopied(true);
      toast.success("Url is copy to clipboard")
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link: '+ err);
      // Fallback for older browsers
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

    if (roomFromUrl && !collaborationStarted && socket) {
      setCurrentRoomId(roomFromUrl);
      setRoomId(roomFromUrl);
      handleStartCollaboration();
    }
  }, [socket]);

  return (
    <div className="collaboration-modal-overlay" onClick={onClose}>
      <div className="collaboration-modal" onClick={(e) => e.stopPropagation()}>
        <div className="collaboration-modal-header">
          <h2>Live Collaboration</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="collaboration-modal-content">
          {!collaborationStarted ? (
            <>
              <p>Start a live collaboration session to draw together with others in real-time.</p>

              <div className="user-name-input">
                <label>Your Name:</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <button
                className="start-collaboration-btn"
                onClick={handleStartCollaboration}
                disabled={isConnecting}
              >
                {isConnecting ? 'Starting...' : 'Start Collaboration'}
              </button>
            </>
          ) : (
            <>
              <div className="collaboration-active">
                <h3>🟢 Collaboration Active</h3>
                <p>Room ID: <code>{currentRoomId}</code></p>

                <div className="share-link">
                  <button onClick={copyLink} className="copy-link-btn">
                    {copied ? <IoCheckmarkOutline /> : <IoCopyOutline />}
                    {copied ? 'Copied!' : 'Copy Invite Link'}
                  </button>
                </div>

                <div className="collaboration-info">
                  <p>Share the invite link with others to collaborate in real-time.</p>
                  <p>🔒 End-to-end encrypted and private.</p>
                </div>

                <button
                  className="stop-collaboration-btn"
                  onClick={handleStopCollaboration}
                >
                  <IoStopCircleOutline />
                  Stop Collaboration
                </button>
              </div>
            </>
          )}
        </div>

        <div className="collaboration-modal-footer">
          <p>Don't worry, the session is end-to-end encrypted, and fully private. Not even our server can see what you draw.</p>
          {collaborationStarted && (
            <p><small>Stopping the session will disconnect you from the room, but you'll be able to continue working with the scene, locally.</small></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborationModal;
