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
  const dropdownRef = useRef(null);

  // Persist login across refresh
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
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

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      console.log("User signed in:", result.user);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Failed to login. Please try again.");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setShowDropdown(false);
      console.log("User logged out");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleMyProfile = () => {
    // Add your profile logic here
    console.log("Navigate to profile");
    setShowDropdown(false);
  };

  const handleCollection = () => {
    // Add your collection logic here
    console.log("Navigate to collection");
    setShowDropdown(false);
  };

  return (
    <div className="rightbar-container">
      <button className="btn btn-share">
        <span className="btn-text">Share</span>
      </button>

      {user ? (
        <div className="user-menu-container" ref={dropdownRef}>
          <button className="btn btn-user" onClick={toggleDropdown}>
            <span className="btn-icon">
              <img
                src={user.photoURL}
                alt="profile"
                className="profile-image"
              />
            </span>
            <span className="btn-text">{user.displayName?.split(" ")[0] || "User"}</span>
            <MdKeyboardArrowDown
              className={`dropdown-arrow ${showDropdown ? 'rotated' : ''}`}
            />
          </button>

          {showDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <img
                  src={user.photoURL}
                  alt="profile"
                  className="dropdown-profile-image"
                />
                <div className="user-info">
                  <div className="user-name">{user.displayName}</div>
                  <div className="user-email">{user.email}</div>
                </div>
              </div>

              <div className="dropdown-divider"></div>

              <ul className="dropdown-list">
                <li className="dropdown-item" onClick={handleMyProfile}>
                  <IoPersonOutline className="dropdown-icon" />
                  <span>My Profile</span>
                </li>
                <li className="dropdown-item" onClick={handleCollection}>
                  <IoFolderOutline className="dropdown-icon" />
                  <span>Collection</span>
                </li>
                <li className="dropdown-item logout-item" onClick={handleLogout}>
                  <IoExitOutline className="dropdown-icon" />
                  <span>Logout</span>
                </li>
              </ul>
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
  );
};

export default Rightbar;
