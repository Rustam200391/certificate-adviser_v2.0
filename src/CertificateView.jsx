import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function CertificateView() {
  const { id } = useParams();

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // =====================================================
    // 🟡 MOCK DATABASE
    // =====================================================
    //
    // ПОКА читаем сертификат из localStorage.
    //
    // 🔴 BACKEND API
    // Позже этот блок будет заменён на:
    //
    // fetch(`BACKEND_API_URL/api/certificates/${id}`)
    //
    // =====================================================

    const saved = JSON.parse(localStorage.getItem("certificates") || "[]");

    const foundCertificate = saved.find(
      (cert) => String(cert.id) === String(id),
    );

    setCertificate(foundCertificate || null);
    setLoading(false);
  }, [id]);

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2>Loading certificate...</h2>
        </div>
      </div>
    );
  }

  // =====================================================
  // NOT FOUND
  // =====================================================

  if (!certificate) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2>Certificate not found</h2>

          <p>
            Certificate with ID <strong>{id}</strong> does not exist.
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // CERTIFICATE VIEW
  // =====================================================

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Medical Certificate</h1>

        <div style={styles.info}>
          <p>
            <strong>Patient:</strong> {certificate.patientFirstName}{" "}
            {certificate.patientLastName}
          </p>

          <p>
            <strong>Doctor:</strong> {certificate.doctorFirstName}{" "}
            {certificate.doctorLastName}
          </p>

          <p>
            <strong>Specialization:</strong> {certificate.doctorSpecialization}
          </p>

          <p>
            <strong>Issue Date:</strong> {certificate.entryDate}
          </p>

          <p>
            <strong>Expiry Date:</strong> {certificate.expiryDate}
          </p>
        </div>

        {/* =================================================
            FINAL CERTIFICATE IMAGE
        ================================================= */}

        <img
          src={certificate.certificateData}
          alt="Medical Certificate"
          style={styles.certificateImage}
        />
      </div>
    </div>
  );
}

// =========================================================
// STYLES
// =========================================================

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f5f5f5",
    padding: "40px 20px",
    boxSizing: "border-box",
  },

  card: {
    maxWidth: "1000px",
    margin: "0 auto",
    background: "white",
    padding: "30px",
    borderRadius: "15px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
    textAlign: "center",
  },

  title: {
    marginBottom: "25px",
  },

  info: {
    textAlign: "left",
    marginBottom: "30px",
    padding: "20px",
    background: "#f8fafc",
    borderRadius: "10px",
  },

  certificateImage: {
    display: "block",
    maxWidth: "100%",
    height: "auto",
    margin: "0 auto",
    borderRadius: "8px",
  },
};

export default CertificateView;
