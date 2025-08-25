import Sidebar from '../components/Sidebar/Sidebar';
import Toolbar from '../components/Toolbar/Toolbar';
import Canvas from '../components/Canvas/Canvas';
import BottomControls from '../components/BottomControls/BottomControls';
import Topbar from '../components/Topbar/Topbar';
import Rightbar from '../components/Rightbar/Rightbar';
import "./App.css";
import { useState } from 'react';

function App() {
  const [selectedTool, setSelectedTool] = useState("select");
  const [showToolbar, setShowToolbar] = useState(false);

  const handleToolSelect = (tool) => {
    setSelectedTool(tool);

    // Hide toolbar for lock, hand, select
    if (["lock", "hand", "select"].includes(tool)) {
      setShowToolbar(false);
    } else {
      setShowToolbar(true);
    }
  };

  return (
    <div className="app">
      <div className="layout">
        <header className="topbar">
          <Topbar onToolSelect={handleToolSelect} />
        </header>

        <aside className="sidebar">
          <Sidebar />
        </aside>

        <aside className='rightbar'>
          <Rightbar />
        </aside>

        <main className="canvas">
          <Canvas selectedTool={selectedTool} />
        </main>

        {/* Toolbar only shows when allowed */}
        {showToolbar && (
          <aside className="toolbar">
            <Toolbar />
          </aside>
        )}

        <footer className="bottom-controls">
          <BottomControls />
        </footer>
      </div>
    </div>
  );
}

export default App;
