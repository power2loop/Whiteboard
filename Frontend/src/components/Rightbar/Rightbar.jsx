import React, { useState, useEffect, useRef } from "react";
import "./Rightbar.css";
import { IoLogInOutline } from "react-icons/io5";
import { MdKeyboardArrowDown } from "react-icons/md";
import { IoPersonOutline, IoFolderOutline, IoExitOutline } from "react-icons/io5";
import { auth, provider, signInWithPopup, signOut } from "../../services/authentication/auth";
import { onAuthStateChanged } from "firebase/auth";

const Rightbar = () => {
  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
      }
    };

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showDropdown]);

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
    <div className="rightbar-container">
      <button className="btn btn-share">
        <span className="btn-text">Share</span>
      </button>

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
  );
};

export default Rightbar;
