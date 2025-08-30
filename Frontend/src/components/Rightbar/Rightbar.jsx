// Rightbar.jsx
import React, { useState, useEffect } from "react";
import "./Rightbar.css";
import { IoLogInOutline } from "react-icons/io5";
import { auth, provider, signInWithPopup, signOut } from "../../services/authentication/auth";
import { onAuthStateChanged } from "firebase/auth";

const Rightbar = () => {
  const [user, setUser] = useState(null);

  // Persist login across refresh
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
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
      console.log("User logged out");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="rightbar-container">
      <button className="btn btn-share">
        <span className="btn-text">Share</span>
      </button>

      {user ? (
        <button className="btn btn-library" onClick={handleLogout}>
          <span className="btn-icon">
            <img
              src={user.photoURL}
              alt="profile"
              style={{ width: "28px", height: "28px", borderRadius: "50%" }}
            />
          </span>
          <span className="btn-text">{user.displayName?.split(" ")[0] || "Logout"}</span>
        </button>
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
