import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.jsx'
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";

createRoot(document.getElementById('root')).render(
  <>
    <App />
    <ToastContainer
      position="bottom-right"
      autoClose={2000}
      hideProgressBar={false}
      newestOnTop={true}
      closeOnClick
      pauseOnHover
      draggable
      theme="light"

      // Add custom styles here
      style={{
        fontSize: '10px',
      }}
      toastStyle={{
        backgroundColor: '#f8f9fa',
        color: '#333',
        borderRadius: '8px',
        minHeight: '40px',
        width: '180px',
        fontSize: '10px',
        padding: '12px 16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: '1px solid #e9ecef'
      }}
    />

  </>
)
