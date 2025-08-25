import React from 'react'
import './Rightbar.css'

const Rightbar = () => {
    return (
        <div className='rightbar-container'>
            <button className='btn btn-share'>
                <span className='btn-text'>Share</span>
                {/* <span className='badge'>1</span> */}
            </button>
            <button className='btn btn-library'>
                <span className='btn-icon'>📚</span>
                <span className='btn-text'>Login</span>
            </button>
        </div>
    )
}

export default Rightbar
