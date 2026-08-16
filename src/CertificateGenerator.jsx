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
      alert("Сначала загрузите сертификат!");
      return;
    }

    if (!qrImage) {
      alert("Сначала сгенерируйте QR!");
      return;
    }

    // =======================================================
    // UNIQUE CERTIFICATE ID
    // =======================================================

    const id = Date.now().toString();

    // =======================================================
    // 🔴 BACKEND API — CERTIFICATE URL
    // =======================================================
    //
    // ПОКА:
    // localhost используется для тестирования.
    //
    // ПОЗЖЕ БЕКЕНДЕР/DEPLOYMENT ДАСТ НАСТОЯЩИЙ DOMAIN.
    //
    // Например:
    //
    // https://clinic.az/certificate/${id}
    //
    // =======================================================

    const certificateUrl = `${window.location.origin}/certificate/${id}`;

    // =======================================================
    // 🔴 BACKEND API — ENDPOINT ДЛЯ СОХРАНЕНИЯ
    // =======================================================
    //
    // ЗДЕСЬ ПОЗЖЕ БУДЕТ:
    //
    // POST /api/certificates
    //
    // Например:
    //
    // fetch("https://api.clinic.az/api/certificates")
    //
    // Сейчас fetch НЕ НУЖЕН.
    // Работаем через localStorage.
    //
    // =======================================================

    // =======================================================
    // GENERATE QR WITH CERTIFICATE URL
    // =======================================================

    try {
      await generateQR(certificateUrl);
    } catch (error) {
      console.error("QR generation failed:", error);

      return;
    }

    // -------------------------------------------------------
    // IMPORTANT:
    // React state qrImage обновляется не мгновенно.
    // Поэтому здесь повторно генерируем QR напрямую.
    // -------------------------------------------------------

    const qrDataUrl = await QRCode.toDataURL(certificateUrl, {
      width: qrSize,
      margin: 2,
    });

    // -------------------------------------------------------
    // Create final image with QR
    // -------------------------------------------------------

    const canvas = canvasRef.current;

    const certificateData = canvas.toDataURL("image/png");

    const certificate = {
      id,

      // Patient
      patientFirstName: formData.patientFirstName,

      patientLastName: formData.patientLastName,

      patientBirthDate: formData.patientBirthDate,

      documentSeries: formData.documentSeries,

      documentNumber: formData.documentNumber,

      // Doctor
      doctorFirstName: formData.doctorFirstName,

      doctorLastName: formData.doctorLastName,

      doctorSpecialization: formData.doctorSpecialization,

      // Certificate
      entryDate: formData.entryDate,

      expiryDate: formData.certificateExpiryDate,

      // QR
      qrUrl: certificateUrl,

      qrData: qrDataUrl,

      // Final certificate image
      certificateData,

      // Created timestamp
      createdAt: new Date().toISOString(),
    };

    // =======================================================
    // 🟡 MOCK DATABASE
    // =======================================================
    //
    // ЭТО ВРЕМЕННАЯ ИМИТАЦИЯ DATABASE.
    //
    // КОГДА ПРИДЁТ БЕКЕНДЕР:
    //
    // ВОТ ЭТОТ БЛОК БУДЕТ ЗАМЕНЁН НА:
    //
    // const response = await fetch(
    //   "BACKEND_API_URL/api/certificates",
    //   {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify(certificate),
    //   }
    // );
    //
    // =======================================================

    const saved = JSON.parse(localStorage.getItem("certificates") || "[]");

    saved.push(certificate);

    localStorage.setItem("certificates", JSON.stringify(saved));

    setCertificates(saved);

    // =======================================================
    // SUCCESS
    // =======================================================

    alert("Certificate successfully saved!");
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
