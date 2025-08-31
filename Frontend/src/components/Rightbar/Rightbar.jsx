import React, { useState, useEffect, useRef } from "react";
import "./Rightbar.css";
import { IoLogInOutline, IoShareOutline, IoCopyOutline } from "react-icons/io5";
import { MdKeyboardArrowDown } from "react-icons/md";
import { IoPersonOutline, IoFolderOutline, IoExitOutline, IoClose } from "react-icons/io5";
import { auth, provider, signInWithPopup, signOut } from "../../services/authentication/auth";
import { onAuthStateChanged } from "firebase/auth";

const Rightbar = ({ onStartCollaboration, isCollaborating, collaborators = [] }) => {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const dropdownRef = useRef(null);

  // Persist login across refresh
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    // Close dropdown on escape key
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
        setShowShareModal(false);
      }
    };

    if (showDropdown || showShareModal) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showDropdown, showShareModal]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      console.log("User signed in:", result.user);
    } catch (error) {
      console.error("Login failed:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        alert("Failed to login. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setShowDropdown(false);
      console.log("User logged out");
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Failed to logout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!user) {
      alert('Please login to start collaboration');
      return;
    }

    setIsCreatingBoard(true);
    try {
      const response = await fetch('http://localhost:3000/api/boards/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostUserId: user.uid,
          hostUserName: user.displayName || user.email || 'Anonymous User'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Updated to use query parameters instead of path parameters
        const collaborationUrl = `${window.location.origin}?boardId=${result.data.boardId}`;
        setShareUrl(collaborationUrl);
        setShowShareModal(true);
        
        // Start collaboration mode
        if (onStartCollaboration) {
          onStartCollaboration(
            result.data.boardId, 
            user.uid, 
            user.displayName || user.email || 'Anonymous User'
          );
        }
        
        console.log('Collaboration room created:', result.data.boardId);
      } else {
        alert('Failed to create collaboration room: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Share error:', error);
      alert('Failed to create collaboration room. Please check your connection.');
    } finally {
      setIsCreatingBoard(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
      }
      
      document.body.removeChild(textArea);
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleMyProfile = () => {
    console.log("Navigate to profile");
    setShowDropdown(false);
    // Add your profile navigation logic here
  };

  const handleCollection = () => {
    console.log("Navigate to collection");
    setShowDropdown(false);
    // Add your collection navigation logic here
  };

  const closeShareModal = () => {
    setShowShareModal(false);
    setCopySuccess(false);
  };

  // Get user initial for fallback
  const getUserInitial = () => {
    if (user?.displayName) {
      return user.displayName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <>
      <div className="rightbar-container">
        {/* Share Button */}
        <button 
          className={`btn btn-share ${isCollaborating ? 'active' : ''}`}
          onClick={handleShare}
          disabled={isCreatingBoard || !user}
          title={!user ? "Please login to start collaboration" : "Share whiteboard for collaboration"}
        >
          <span className="btn-icon">
            <IoShareOutline />
          </span>
          <span className="btn-text">
            {isCreatingBoard ? 'Creating...' : isCollaborating ? 'Sharing' : 'Share'}
          </span>
          {isCollaborating && collaborators.length > 0 && (
            <span className="collaborators-count">{collaborators.length}</span>
          )}
        </button>

        {/* User Authentication Section */}
        {user ? (
          <div className="user-menu-container" ref={dropdownRef}>
            <button 
              className="btn btn-user" 
              onClick={toggleDropdown}
              aria-expanded={showDropdown}
              aria-haspopup="true"
              disabled={isLoading}
            >
              <span className="btn-icon">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="profile-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div 
                  className="profile-initial"
                  style={{ display: user.photoURL ? 'none' : 'flex' }}
                >
                  {getUserInitial()}
                </div>
              </span>
              <span className="btn-text">
                {user.displayName?.split(" ")[0] || user.email?.split("@")[0] || "User"}
              </span>
              <MdKeyboardArrowDown
                className={`dropdown-arrow ${showDropdown ? 'rotated' : ''}`}
              />
            </button>

            {showDropdown && (
              <div className="dropdown-menu" role="menu">
                <div className="dropdown-header">
                  <div className="dropdown-profile-container">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt="Profile"
                        className="dropdown-profile-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className="dropdown-profile-initial"
                      style={{ display: user.photoURL ? 'none' : 'flex' }}
                    >
                      {getUserInitial()}
                    </div>
                  </div>
                  <div className="user-info">
                    <div className="user-name" title={user.displayName}>
                      {user.displayName || "User"}
                    </div>
                    <div className="user-email" title={user.email}>
                      {user.email}
                    </div>
                  </div>
                </div>

                <div className="dropdown-divider"></div>

                <ul className="dropdown-list" role="none">
                  <li 
                    className="dropdown-item" 
                    onClick={handleMyProfile}
                    role="menuitem"
                    tabIndex="0"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleMyProfile();
                      }
                    }}
                  >
                    <IoPersonOutline className="dropdown-icon" />
                    <span>My Profile</span>
                  </li>
                  <li 
                    className="dropdown-item" 
                    onClick={handleCollection}
                    role="menuitem"
                    tabIndex="0"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCollection();
                      }
                    }}
                  >
                    <IoFolderOutline className="dropdown-icon" />
                    <span>Collection</span>
                  </li>
                  <li 
                    className="dropdown-item logout-item" 
                    onClick={handleLogout}
                    role="menuitem"
                    tabIndex="0"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleLogout();
                      }
                    }}
                  >
                    <IoExitOutline className="dropdown-icon" />
                    <span>{isLoading ? 'Logging out...' : 'Logout'}</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <button 
            className="btn btn-library" 
            onClick={handleLogin}
            disabled={isLoading}
          >
            <span className="btn-icon">
              <IoLogInOutline style={{ color: "#007bff" }} />
            </span>
            <span className="btn-text">
              {isLoading ? 'Signing in...' : 'Login'}
            </span>
          </button>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="modal-overlay" onClick={closeShareModal}>
          <div className="share-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Share Whiteboard</h3>
              <button 
                className="modal-close-btn"
                onClick={closeShareModal}
                aria-label="Close"
              >
                <IoClose />
              </button>
            </div>
            
            <div className="modal-content">
              <p>Share this link with others to collaborate in real-time:</p>
              
              <div className="share-url-container">
                <input 
                  type="text" 
                  value={shareUrl} 
                  readOnly 
                  className="share-url-input"
                  aria-label="Collaboration URL"
                />
                <button 
                  onClick={copyToClipboard} 
                  className={`copy-button ${copySuccess ? 'success' : ''}`}
                  disabled={copySuccess}
                >
                  <IoCopyOutline />
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {isCollaborating && (
                <div className="collaboration-status">
                  <div className="status-indicator">
                    <div className="status-dot active"></div>
                    <span>Collaboration Active</span>
                  </div>
                  {collaborators.length > 0 && (
                    <div className="collaborators-info">
                      <span className="collaborators-label">
                        {collaborators.length} collaborator{collaborators.length !== 1 ? 's' : ''} online
                      </span>
                      <div className="collaborators-list">
                        {collaborators.slice(0, 3).map((collaborator, index) => (
                          <div key={collaborator.id} className="collaborator-item">
                            <div className="collaborator-avatar">
                              {collaborator.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="collaborator-name">{collaborator.name}</span>
                          </div>
                        ))}
                        {collaborators.length > 3 && (
                          <div className="collaborators-more">
                            +{collaborators.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button onClick={closeShareModal} className="modal-close-button">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Rightbar;
