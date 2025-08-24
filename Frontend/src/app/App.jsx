import Sidebar from '../components/Sidebar/Sidebar';
import Toolbar from '../components/Toolbar/Toolbar';
import Canvas from '../components/Canvas/Canvas';
import BottomControls from '../components/BottomControls/BottomControls';
import Topbar from '../components/Topbar/Topbar';
import "./App.css";

function App() {
  return (
    <div className="app-container">
      <Canvas />
      {/* <Topbar />
      <div className="main-layout">
        <Sidebar />
        <div className="workspace">
          <Toolbar />
          <Canvas />
        </div>
      </div>
      <BottomControls /> */}

    </div>
  );
}

export default App;
