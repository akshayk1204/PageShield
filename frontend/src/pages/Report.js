import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import HybridReport from "../components/HybridReport";

function Report() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await axios.get(`http://localhost:3001/report/${id}`);
        if (res.data?.success) {
          setResult(res.data);
        } else {
          setError("Report not found or incomplete.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load report.");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id]);

  if (loading) return <p style={{ padding: "40px", textAlign: "center" }}>Loading report...</p>;
  if (error) return <p style={{ color: "red", padding: "40px", textAlign: "center" }}>{error}</p>;

  return <HybridReport data={result} />;
}

export default Report;
