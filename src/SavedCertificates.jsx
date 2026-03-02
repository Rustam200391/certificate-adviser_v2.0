import React, { useEffect, useState } from "react";

export default function SavedCertificates() {
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    // Загружаем сертификаты из localStorage после рендера
    setTimeout(() => {
      const saved = JSON.parse(localStorage.getItem("certificates") || "[]");
      setCertificates(saved);
    }, 0);
  }, []);

  if (certificates.length === 0)
    return (
      <p style={{ padding: "20px" }}>
        The certificates have not been saved yet.
      </p>
    );

  return (
    <div style={{ padding: "20px" }}>
      <h2>Viwed saved document (mock database)</h2>
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
            <p>
              <strong>Patient:</strong> {cert.patientFirstName}{" "}
              {cert.patientLastName}
            </p>
            <p>
              <strong>Doctor:</strong> {cert.doctorFirstName}{" "}
              {cert.doctorLastName}
            </p>
            <p>
              <strong>Specialization:</strong> {cert.doctorSpecialization}
            </p>
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
