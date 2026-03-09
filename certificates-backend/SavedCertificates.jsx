import React, { useEffect, useState } from "react";

const API_URL = "http://localhost:8080/certificates";

export default function SavedCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then((data) => setCertificates(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: "20px" }}>Loading certificates…</p>;
  if (error)   return <p style={{ padding: "20px", color: "red" }}>Error: {error}</p>;
  if (certificates.length === 0)
    return <p style={{ padding: "20px" }}>No certificates saved yet.</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Saved Certificates</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
        {certificates.map((cert) => (
          <div
            key={cert.id}
            style={{
              border: "1px solid #ccc",
              borderRadius: "10px",
              padding: "10px",
              width: "220px",
            }}
          >
            <p><strong>Patient:</strong> {cert.patientFirstName} {cert.patientLastName}</p>
            <p><strong>Doctor:</strong>  {cert.doctorFirstName}  {cert.doctorLastName}</p>
            <p><strong>Specialization:</strong> {cert.doctorSpecialization}</p>
            <img
              src={cert.certificateData}
              alt="Certificate"
              style={{ width: "100%", borderRadius: "6px" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
