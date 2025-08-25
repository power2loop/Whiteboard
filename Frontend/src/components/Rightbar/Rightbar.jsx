import React from 'react'
import './Rightbar.css'
import { IoLogInOutline } from "react-icons/io5";

const Rightbar = () => {
    return (
        <div className='rightbar-container'>
            <button className='btn btn-share'>
                <span className='btn-text'>Share</span>
                {/* <span className='badge'>1</span> */}
            </button>
            <button className='btn btn-library'>
                <span className='btn-icon'><IoLogInOutline style={{color: "#007bff"}} /></span>
                <span className='btn-text'>Login</span>
            </button>
        </div>
    )
}

export default Rightbar
