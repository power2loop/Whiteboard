import Sidebar from '../components/Sidebar/Sidebar';
import Toolbar from '../components/Toolbar/Toolbar';
import Canvas from '../components/Canvas/Canvas';
import BottomControls from '../components/BottomControls/BottomControls';
import Topbar from '../components/Topbar/Topbar';
import Rightbar from '../components/Rightbar/Rightbar';
import "./App.css";

function App() {
  return (
    <div className="app">
      <div className="layout">
        <header className="topbar">
          <Topbar />
        </header>

        <aside className="sidebar">
          <Sidebar />
        </aside>
        <aside className='rightbar'><Rightbar /></aside>
        <main className="canvas">
          <Canvas />
        </main>

        <aside className="toolbar">
          <Toolbar />
        </aside>

        <footer className="bottom-controls">
          <BottomControls />
        </footer>
      </div>
    </div>
  );
}

export default App;
