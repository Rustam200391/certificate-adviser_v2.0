import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function CertificateView() {
  const { id } = useParams();

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadCertificate = async () => {
      setLoading(true);
      setLoadError(null);
      setCertificate(null);

      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api/certificates/${encodeURIComponent(id)}`;

      try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
          const error = new Error(`Certificate request failed (HTTP ${response.status}).`);
          error.status = response.status;
          throw error;
        }

        const savedCertificate = await response.json();
        const certificateData = savedCertificate.certificateData;
        const normalizedCertificate = {
          ...savedCertificate,
          certificateData:
            typeof certificateData === "string" &&
            certificateData.length > 0 &&
            !certificateData.startsWith("data:")
              ? `data:image/png;base64,${certificateData}`
              : certificateData,
        };

        if (!cancelled) {
          setCertificate(normalizedCertificate);
        }
      } catch (error) {
        let localCertificate = null;

        try {
          const saved = JSON.parse(localStorage.getItem("certificates") || "[]");
          const localCertificates = Array.isArray(saved) ? saved : [];
          localCertificate = localCertificates.find(
            (cert) =>
              String(cert.id) === String(id) ||
              String(cert.backendId) === String(id),
          );
        } catch (storageError) {
          console.error("Could not read certificates from localStorage:", storageError);
        }

        if (!cancelled) {
          setCertificate(localCertificate || null);
          if (!localCertificate && error.status !== 404) {
            setLoadError("Could not load this certificate. Please try again later.");
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadCertificate();

    return () => {
      cancelled = true;
    };
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
          <h2>{loadError ? "Unable to load certificate" : "Certificate not found"}</h2>

          <p>
            {loadError || (
              <>
                Certificate with ID <strong>{id}</strong> does not exist.
              </>
            )}
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
