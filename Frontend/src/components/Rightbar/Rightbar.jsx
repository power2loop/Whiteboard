// Rightbar.jsx
import React, { useState, useEffect } from "react";
import "./Rightbar.css";
import { IoLogInOutline, IoChevronDown, IoPersonOutline, IoFolderOutline, IoLogOutOutline } from "react-icons/io5";
import { auth, provider, signInWithPopup, signOut } from "../../services/authentication/auth";
import { onAuthStateChanged } from "firebase/auth";
import CollaborationModal from '../CollaborationModal/CollaborationModal';
import { toast } from "react-toastify";

const Rightbar = ({ socket, roomId, setRoomId }) => {
  const [user, setUser] = useState(null);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Persist login across refresh
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      // When user logs in, emit their info to socket
      if (currentUser && socket) {
        socket.emit('userInfo', {
          userId: currentUser.uid,
          name: currentUser.displayName,
          photoURL: currentUser.photoURL,
          room: roomId
        });
      }
    });
    return () => unsubscribe();
  }, [socket, roomId]);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      // console.log("User signed in:", result.user);
      toast.success("Login Successfully.")
    } catch (error) {
      // console.error("Login failed:", error);
      toast.error("Login Failed" + error)
      // alert("Failed to login. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      // If user is in a collaboration session, leave the room first
      if (socket && roomId && user) {
        socket.emit('leaveRoom', {
          roomId: roomId,
          user: {
            id: user.uid,
            name: user.displayName
          }
        });
      }

      // Sign out from Firebase
      toast.info(user.displayName +" logged out successfully")
      await signOut(auth);
      setUser(null);
      setShowProfileDropdown(false);
      setShowCollaborationModal(false);
      
      // Clear any local storage related to user session
      localStorage.removeItem('collaborationRoom');
      
      // console.log("${user.displayName} logged out successfully");
      
      // Optionally redirect to home or refresh page
      // window.location.reload();
      
    } catch (error) {
      // console.error("Logout failed:", error);
      toast.error("Logout failed:", error)
      // alert("Failed to logout. Please try again.");
    }
  };

  const handleShare = () => {
    setShowCollaborationModal(true);
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleProfileClick = () => {
    // Handle profile navigation
    setShowProfileDropdown(false);
    // Add your profile navigation logic here
    // Example: navigate('/profile') if using React Router
  };

  const handleCollectionsClick = () => {
    // Handle collections navigation
    setShowProfileDropdown(false);
    // Add your collections navigation logic here
    // Example: navigate('/collections') if using React Router
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.profile-container')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showProfileDropdown]);

  return (
    <>
      <div className="rightbar-container">
        <button className="btn btn-share" onClick={handleShare}>
          <span className="btn-text">Share</span>
        </button>

        {user ? (
          <div className="profile-container">
            <button className="btn btn-library" onClick={toggleProfileDropdown}>
              <span className="btn-icon">
                <img
                  src={user.photoURL}
                  alt="profile"
                  style={{ width: "28px", height: "28px", borderRadius: "50%" }}
                />
              </span>
              <span className="btn-text">{user.displayName?.split(" ")[0]}</span>
              <IoChevronDown className={`dropdown-arrow ${showProfileDropdown ? 'rotated' : ''}`} />
            </button>
            
            {showProfileDropdown && (
              <div className="profile-dropdown">
                <div className="dropdown-header">
                  <img
                    src={user.photoURL}
                    alt="profile"
                    className="dropdown-avatar"
                  />
                  <div className="user-info">
                    <div className="user-name">{user.displayName}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>
                
                <div className="dropdown-divider"></div>
                
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={handleProfileClick}>
                    <IoPersonOutline className="dropdown-icon" />
                    <span>Profile</span>
                  </button>
                  
                  <button className="dropdown-item" onClick={handleCollectionsClick}>
                    <IoFolderOutline className="dropdown-icon" />
                    <span>Collections</span>
                  </button>
                  
                  <div className="dropdown-divider"></div>
                  
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <IoLogOutOutline className="dropdown-icon" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button className="btn btn-library" onClick={handleLogin}>
            <span className="btn-icon">
              <IoLogInOutline style={{ color: "#007bff" }} />
            </span>
            <span className="btn-text">Login</span>
          </button>
        )}
      </div>

      {showCollaborationModal && (
        <CollaborationModal 
          user={user}
          socket={socket}
          roomId={roomId}
          setRoomId={setRoomId}
          onClose={() => setShowCollaborationModal(false)}
        />
      )}
    </>
  );
};

export default Rightbar;
