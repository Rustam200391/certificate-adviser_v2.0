// CertificateGenerator.jsx

import React, { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import logoImg from "./assets/logo.jpg";
import "./CertificateGenerator.css";

function CertificateGenerator() {
  const canvasRef = useRef(null);

  // =========================================================
  // FORM DATA
  // =========================================================

  const [formData, setFormData] = useState({
    patientFirstName: "",
    patientLastName: "",
    patientBirthDate: "",
    documentSeries: "",
    documentNumber: "",
    doctorFirstName: "",
    doctorLastName: "",
    doctorSpecialization: "",
    entryDate: "",
    certificateExpiryDate: "",
    certificateFile: null,
  });

  const [imageObj, setImageObj] = useState(null);
  const [qrImage, setQrImage] = useState(null);

  const [qrPosition, setQrPosition] = useState({
    x: 100,
    y: 100,
  });

  const [dragging, setDragging] = useState(false);

  // =========================================================
  // SAVED CERTIFICATES
  // =========================================================

  const [certificates, setCertificates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const qrSize = 150;

  // =========================================================
  // SPECIALIZATIONS
  // =========================================================

  const specializations = [
    "Therapist",
    "Surgeon",
    "Cardiologist",
    "Neurologist",
    "Ophthalmologist",
    "Dentist",
    "Dermatologist",
    "Pediatrician",
    "Gynecologist",
    "Urologist",
    "Oncologist",
    "Psychiatrist",
  ];

  // =========================================================
  // LOAD MOCK DATABASE
  // =========================================================

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("certificates") || "[]");

    setCertificates(saved);
  }, []);

  // =========================================================
  // FORM INPUT
  // =========================================================

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    // ---------------------------------------------------------
    // CERTIFICATE IMAGE
    // ---------------------------------------------------------

    if (name === "certificateFile") {
      const file = files?.[0];

      setFormData((prev) => ({
        ...prev,
        certificateFile: file || null,
      }));

      if (file && file.type.startsWith("image/")) {
        const objectUrl = URL.createObjectURL(file);

        const img = new Image();

        img.onload = () => {
          setImageObj(img);
          URL.revokeObjectURL(objectUrl);
        };

        img.src = objectUrl;
      }

      return;
    }

    // ---------------------------------------------------------
    // NORMAL INPUT
    // ---------------------------------------------------------

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // ---------------------------------------------------------
    // AUTOMATIC EXPIRY DATE
    // ---------------------------------------------------------

    if (name === "entryDate" && value) {
      const issueDate = new Date(value);

      issueDate.setFullYear(issueDate.getFullYear() + 1);

      const expiryDate = issueDate.toISOString().split("T")[0];

      setFormData((prev) => ({
        ...prev,
        entryDate: value,
        certificateExpiryDate: expiryDate,
      }));
    }
  };

  // =========================================================
  // GENERATE QR
  // =========================================================

  const generateQR = async (qrContent) => {
    try {
      const qrUrl = await QRCode.toDataURL(qrContent, {
        width: qrSize,
        margin: 2,
      });

      const img = new Image();

      img.onload = () => {
        setQrImage(img);
      };

      img.src = qrUrl;
    } catch (error) {
      console.error("QR generation error:", error);
    }
  };

  // =========================================================
  // DRAW CERTIFICATE + QR
  // =========================================================

  const drawCanvas = () => {
    if (!imageObj || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;

    const ctx = canvas.getContext("2d");

    canvas.width = imageObj.width;
    canvas.height = imageObj.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Original certificate
    ctx.drawImage(imageObj, 0, 0);

    // QR
    if (qrImage) {
      ctx.drawImage(qrImage, qrPosition.x, qrPosition.y, qrSize, qrSize);
    }
  };

  useEffect(() => {
    drawCanvas();
  }, [imageObj, qrImage, qrPosition]);

  // =========================================================
  // DRAG QR
  // =========================================================

  const handleMouseDown = (e) => {
    if (!canvasRef.current || !qrImage) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();

    const scaleX = canvasRef.current.width / rect.width;

    const scaleY = canvasRef.current.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;

    const y = (e.clientY - rect.top) * scaleY;

    if (
      x >= qrPosition.x &&
      x <= qrPosition.x + qrSize &&
      y >= qrPosition.y &&
      y <= qrPosition.y + qrSize
    ) {
      setDragging(true);
    }
  };

  const handleMouseMove = (e) => {
    if (!dragging || !canvasRef.current) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();

    const scaleX = canvasRef.current.width / rect.width;

    const scaleY = canvasRef.current.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;

    const y = (e.clientY - rect.top) * scaleY;

    let newX = x - qrSize / 2;

    let newY = y - qrSize / 2;

    // Prevent QR from going outside canvas
    newX = Math.max(0, Math.min(newX, canvasRef.current.width - qrSize));

    newY = Math.max(0, Math.min(newY, canvasRef.current.height - qrSize));

    setQrPosition({
      x: newX,
      y: newY,
    });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  // =========================================================
  // DOWNLOAD CERTIFICATE
  // =========================================================

  const downloadImage = () => {
    if (!canvasRef.current) {
      return;
    }

    const link = document.createElement("a");

    link.download = "medical_certificate_with_qr.png";

    link.href = canvasRef.current.toDataURL("image/png");

    link.click();
  };

  // =========================================================
  // SAVE CERTIFICATE
  // =========================================================

  const saveToDatabase = async () => {
    if (!imageObj) {
      alert("Please upload a certificate image first.");
      return;
    }

    if (!qrImage) {
      alert("Please generate the QR code first.");
      return;
    }

    const temporaryId = Date.now().toString();
    const certificateUrl = `${window.location.origin}/certificate/${temporaryId}`;

    try {
      await generateQR(certificateUrl);

      const qrDataUrl = await QRCode.toDataURL(certificateUrl, {
        width: qrSize,
        margin: 2,
      });

      if (!canvasRef.current) {
        throw new Error("The certificate image is not ready. Please try again.");
      }

      const finalCanvas = document.createElement("canvas");
      finalCanvas.width = imageObj.width;
      finalCanvas.height = imageObj.height;
      const finalContext = finalCanvas.getContext("2d");
      finalContext.drawImage(imageObj, 0, 0);
      const qrImageForSave = new Image();
      qrImageForSave.src = qrDataUrl;
      await qrImageForSave.decode();
      finalContext.drawImage(qrImageForSave, qrPosition.x, qrPosition.y, qrSize, qrSize);

      const certificateData = finalCanvas.toDataURL("image/png");
      const imageBlob = await (await fetch(certificateData)).blob();
      const imageFile = new File([imageBlob], "certificate.png", { type: "image/png" });

      const certificate = {
        id: temporaryId,
        patientFirstName: formData.patientFirstName,
        patientLastName: formData.patientLastName,
        patientBirthDate: formData.patientBirthDate,
        documentSeries: formData.documentSeries,
        documentNumber: formData.documentNumber,
        doctorFirstName: formData.doctorFirstName,
        doctorLastName: formData.doctorLastName,
        doctorSpecialization: formData.doctorSpecialization,
        entryDate: formData.entryDate,
        expiryDate: formData.certificateExpiryDate,
        qrUrl: certificateUrl,
        qrData: qrDataUrl,
        certificateData,
        createdAt: new Date().toISOString(),
      };

      const dto = {
        patientFirstName: formData.patientFirstName,
        patientLastName: formData.patientLastName,
        doctorFirstName: formData.doctorFirstName,
        doctorLastName: formData.doctorLastName,
        doctorSpecialization: formData.doctorSpecialization,
      };
      const body = new FormData();
      body.append("dto", JSON.stringify(dto));
      body.append("file", imageFile);

      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/api/certificates`;
      let response;
      try {
        response = await fetch(apiUrl, { method: "POST", body });
      } catch {
        throw new Error("Cannot reach the certificate server. Check that the backend is running and try again.");
      }

      if (!response.ok) {
        const responseText = await response.text();
        let message = `Certificate save failed (HTTP ${response.status}).`;
        try {
          const errorPayload = JSON.parse(responseText);
          message = errorPayload.message || errorPayload.error || message;
        } catch {
          if (responseText) message = responseText;
        }
        throw new Error(message);
      }

      const savedCertificate = await response.json();
      certificate.backendId = savedCertificate.id;
      certificate.patientFirstName = savedCertificate.patientFirstName;
      certificate.patientLastName = savedCertificate.patientLastName;
      certificate.doctorFirstName = savedCertificate.doctorFirstName;
      certificate.doctorLastName = savedCertificate.doctorLastName;
      certificate.doctorSpecialization = savedCertificate.doctorSpecialization;

      const saved = JSON.parse(localStorage.getItem("certificates") || "[]");
      saved.push(certificate);
      localStorage.setItem("certificates", JSON.stringify(saved));
      setCertificates(saved);
      alert("Certificate successfully saved to the database!");
    } catch (error) {
      console.error("Certificate save failed:", error);
      alert(error.message || "Could not save the certificate. Please try again.");
    }
  };
  // =========================================================
  // DELETE CERTIFICATE
  // =========================================================

  const deleteCertificate = (id) => {
    // =======================================================
    // 🔴 BACKEND API — DELETE
    // =======================================================
    //
    // ПОЗЖЕ:
    //
    // await fetch(
    //   `BACKEND_API_URL/api/certificates/${id}`,
    //   {
    //     method: "DELETE"
    //   }
    // );
    //
    // =======================================================

    const updated = certificates.filter((cert) => cert.id !== id);

    setCertificates(updated);

    // Temporary mock DB
    localStorage.setItem("certificates", JSON.stringify(updated));
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const filteredCertificates = certificates.filter((cert) => {
    const fullName =
      `${cert.patientFirstName} ${cert.patientLastName}`.toLowerCase();

    return fullName.includes(searchTerm.toLowerCase());
  });

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="app-wrapper">
      <div className="generator-card">
        {/* =================================================
            LOGO
        ================================================= */}

        {logoImg && (
          <img src={logoImg} alt="Clinic Logo" className="clinic-logo" />
        )}

        <h1 className="main-title">Medical Certificate Generator</h1>

        {/* =================================================
            FORM
        ================================================= */}

        <div className="form-grid">
          {/* PATIENT */}

          <div className="form-section">
            <h2>Patient Info</h2>

            <input
              type="text"
              name="patientFirstName"
              placeholder="First Name"
              value={formData.patientFirstName}
              onChange={handleInputChange}
            />

            <input
              type="text"
              name="patientLastName"
              placeholder="Last Name"
              value={formData.patientLastName}
              onChange={handleInputChange}
            />

            <label>Date of Birth</label>

            <input
              type="date"
              name="patientBirthDate"
              value={formData.patientBirthDate}
              onChange={handleInputChange}
            />

            <input
              type="text"
              name="documentSeries"
              placeholder="Document Series"
              value={formData.documentSeries}
              onChange={handleInputChange}
            />

            <input
              type="text"
              name="documentNumber"
              placeholder="Document Number"
              value={formData.documentNumber}
              onChange={handleInputChange}
            />
          </div>

          {/* DOCTOR */}

          <div className="form-section">
            <h2>Doctor Info</h2>

            <input
              type="text"
              name="doctorFirstName"
              placeholder="Doctor First Name"
              value={formData.doctorFirstName}
              onChange={handleInputChange}
            />

            <input
              type="text"
              name="doctorLastName"
              placeholder="Doctor Last Name"
              value={formData.doctorLastName}
              onChange={handleInputChange}
            />

            <select
              name="doctorSpecialization"
              value={formData.doctorSpecialization}
              onChange={handleInputChange}
            >
              <option value="">Select Specialization</option>

              {specializations.map((specialization) => (
                <option key={specialization} value={specialization}>
                  {specialization}
                </option>
              ))}
            </select>

            <label>Certificate Issue Date</label>

            <input
              type="date"
              name="entryDate"
              value={formData.entryDate}
              onChange={handleInputChange}
            />

            <label>Certificate Expiry Date</label>

            <input
              type="date"
              name="certificateExpiryDate"
              value={formData.certificateExpiryDate}
              readOnly
            />

            <input
              type="file"
              accept="image/*"
              name="certificateFile"
              onChange={handleInputChange}
            />
          </div>
        </div>

        {/* =================================================
            CANVAS
        ================================================= */}

        {imageObj && (
          <div className="canvas-wrapper">
            <h3>
              {qrImage ? "Drag QR to position" : "Click below to generate QR"}
            </h3>

            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />

            <div className="button-group">
              {!qrImage && (
                <button
                  onClick={() =>
                    generateQR(
                      JSON.stringify({
                        patient: `${formData.patientFirstName} ${formData.patientLastName}`,

                        doctor: `${formData.doctorFirstName} ${formData.doctorLastName}`,

                        specialization: formData.doctorSpecialization,

                        entryDate: formData.entryDate,

                        expiry: formData.certificateExpiryDate,
                      }),
                    )
                  }
                >
                  Generate QR
                </button>
              )}

              {qrImage && (
                <>
                  <button onClick={downloadImage}>Download Certificate</button>

                  <button onClick={saveToDatabase}>Save to Database</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* =================================================
            SAVED CERTIFICATES
        ================================================= */}

        {certificates.length > 0 && (
          <div
            style={{
              marginTop: "40px",
              width: "100%",
            }}
          >
            <h2>Saved Certificates</h2>

            {/* SEARCH */}

            <input
              type="text"
              placeholder="Search by patient name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "10px",
                width: "100%",
                maxWidth: "400px",
                marginBottom: "20px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />

            {/* CERTIFICATES */}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "20px",
              }}
            >
              {filteredCertificates.map((cert) => (
                <div
                  key={cert.id}
                  style={{
                    border: "1px solid #ccc",

                    borderRadius: "10px",

                    padding: "15px",

                    width: "220px",

                    position: "relative",

                    background: "#fff",
                  }}
                >
                  {/* DELETE */}

                  <button
                    onClick={() => deleteCertificate(cert.id)}
                    style={{
                      position: "absolute",

                      top: "5px",

                      right: "5px",

                      background: "#dc2626",

                      color: "white",

                      border: "none",

                      borderRadius: "4px",

                      cursor: "pointer",

                      padding: "3px 7px",
                    }}
                  >
                    X
                  </button>

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

                  {/* =================================================
                        🔴 BACKEND API — VIEW CERTIFICATE
                    ================================================= */}

                  <a
                    href={`/certificate/${cert.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-block",

                      marginTop: "10px",

                      textDecoration: "none",

                      fontWeight: "bold",
                    }}
                  >
                    View Certificate
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CertificateGenerator;
