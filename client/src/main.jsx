import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { AppProvider } from "./controllers/AppController.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "rgba(17, 20, 28, 0.92)",
              color: "#f5efe1",
              border: "1px solid rgba(196, 168, 116, 0.22)",
              backdropFilter: "blur(18px)",
            },
          }}
        />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
