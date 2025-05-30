import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post("http://localhost:3001/analyze", { url });

      if (res.data?.success && res.data?.id) {
        navigate(`/report/${res.data.id}`); // ✅ redirect to report page
      } else {
        setError("Scan did not complete successfully.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to analyze URL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "40px auto", fontFamily: "Arial" }}>
      <h1>🔍 PageShield Scanner</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={url}
          placeholder="Enter URL (e.g. https://example.com)"
          onChange={(e) => setUrl(e.target.value)}
          style={{ width: "70%", padding: "10px", fontSize: "16px" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "10px 20px", marginLeft: "10px", fontSize: "16px" }}
        >
          {loading ? "Scanning..." : "Scan"}
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: "20px" }}>{error}</p>}
    </div>
  );
}

export default Home;
