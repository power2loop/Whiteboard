import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.jsx'
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";

createRoot(document.getElementById('root')).render(
  <>
    <App />
    <ToastContainer
      position="top-right"   // top-right, top-center, bottom-left, etc.
      autoClose={2000}       // auto close after 3s
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick
      pauseOnHover
      draggable
      theme="light"          // light, dark, colored
    />
  </>
)
