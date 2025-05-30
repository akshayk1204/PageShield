import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ReportPage from "./pages/Report"; // 👈 import your report page

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/report/:id" element={<ReportPage />} /> {/* ✅ Enable this */}
      </Routes>
    </Router>
  );
}

export default App;
