// CertificateGenerator.jsx
import React, { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import logoImg from "./assets/logo.jpg"; // логотип клиники
import "./CertificateGenerator.css";

function CertificateGenerator() {
  const canvasRef = useRef(null);
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
  const [qrPosition, setQrPosition] = useState({ x: 100, y: 100 });
  const [dragging, setDragging] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const qrSize = 150;
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

  // ----------------------- Обработчики форм -----------------------
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "certificateFile") {
      const file = files[0];
      setFormData({ ...formData, certificateFile: file });
      if (file && file.type.startsWith("image/")) {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => setImageObj(img);
      }
    } else {
      setFormData({ ...formData, [name]: value });

      if (name === "entryDate") {
        // Автоматическая дата окончания +1 год
        const issueDate = new Date(value);
        issueDate.setFullYear(issueDate.getFullYear() + 1);
        const expiryDate = issueDate.toISOString().split("T")[0];
        setFormData((prev) => ({ ...prev, certificateExpiryDate: expiryDate }));
      }
    }
  };

  // ----------------------- Генерация QR -----------------------
  const generateQR = async () => {
    const qrData = JSON.stringify({
      patient: `${formData.patientFirstName} ${formData.patientLastName}`,
      doctor: `${formData.doctorFirstName} ${formData.doctorLastName}`,
      specialization: formData.doctorSpecialization,
      entryDate: formData.entryDate,
      expiry: formData.certificateExpiryDate,
    });

    const qrUrl = await QRCode.toDataURL(qrData, { width: qrSize });
    const img = new Image();
    img.src = qrUrl;
    img.onload = () => setQrImage(img);
  };

  // ----------------------- Рисуем Canvas -----------------------
  const drawCanvas = () => {
    if (!imageObj) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = imageObj.width;
    canvas.height = imageObj.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageObj, 0, 0);

    if (qrImage) {
      ctx.drawImage(qrImage, qrPosition.x, qrPosition.y, qrSize, qrSize);
    }
  };

  useEffect(() => {
    drawCanvas();
  }, [imageObj, qrImage, qrPosition]);

  // ----------------------- Drag-and-drop QR -----------------------
  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (
      x >= qrPosition.x &&
      x <= qrPosition.x + qrSize &&
      y >= qrPosition.y &&
      y <= qrPosition.y + qrSize
    )
      setDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setQrPosition({ x: x - qrSize / 2, y: y - qrSize / 2 });
  };

  const handleMouseUp = () => setDragging(false);

  // ----------------------- Скачивание -----------------------
  const downloadImage = () => {
    const link = document.createElement("a");
    link.download = "medical_certificate_with_qr.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  // ----------------------- Mock Database -----------------------
  const saveToDatabase = () => {
    if (!qrImage || !imageObj) {
      alert("First, download the certificate and generate a QR code!");
      return;
    }

    const certificate = {
      id: Date.now(),
      patientFirstName: formData.patientFirstName,
      patientLastName: formData.patientLastName,
      doctorFirstName: formData.doctorFirstName,
      doctorLastName: formData.doctorLastName,
      doctorSpecialization: formData.doctorSpecialization,
      entryDate: formData.entryDate,
      expiryDate: formData.certificateExpiryDate,
      qrData: qrImage.src,
      certificateData: canvasRef.current.toDataURL("image/png"),
    };

    const saved = JSON.parse(localStorage.getItem("certificates") || "[]");
    saved.push(certificate);
    localStorage.setItem("certificates", JSON.stringify(saved));
    setCertificates(saved); // обновляем локальный state
    alert("The certificate is saved locally!");
  };

  // ----------------------- Удаление сертификата -----------------------
  const deleteCertificate = (id) => {
    const updated = certificates.filter((cert) => cert.id !== id);
    setCertificates(updated);
    localStorage.setItem("certificates", JSON.stringify(updated));
  };

  // ----------------------- Фильтрация по поиску -----------------------
  const filteredCertificates = certificates.filter((cert) =>
    `${cert.patientFirstName} ${cert.patientLastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  // ----------------------- JSX -----------------------
  return (
    <div className="app-wrapper">
      <div className="generator-card">
        {logoImg && (
          <a
            href="https://media.internationalsos.com/about-us"
            alt="Clinic Logo"
            target="_blank"
            rel="noopener noreferrer"
          >
            {" "}
            <img src={logoImg} alt="Clinic Logo" className="clinic-logo" />
          </a>
        )}
        <h1 className="main-title">Medical Certificate Generator</h1>

        <div className="form-grid">
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
              {specializations.map((s, i) => (
                <option key={i}>{s}</option>
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
              {!qrImage && <button onClick={generateQR}>Generate QR</button>}
              {qrImage && (
                <>
                  <button onClick={downloadImage}>Download Certificate</button>
                  <button onClick={saveToDatabase}>Save to Database</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ----------------------- Search & List of saved certificates ----------------------- */}
        {certificates.length > 0 && (
          <div style={{ marginTop: "40px" }}>
            <h2>Saved Certificates</h2>
            <input
              type="text"
              placeholder="Search by patient name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: "8px",
                width: "100%",
                maxWidth: "400px",
                marginBottom: "20px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "20px" }}>
              {filteredCertificates.map((cert) => (
                <div
                  key={cert.id}
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: "10px",
                    padding: "10px",
                    width: "220px",
                    position: "relative",
                  }}
                >
                  <button
                    onClick={() => deleteCertificate(cert.id)}
                    style={{
                      position: "absolute",
                      top: "5px",
                      right: "5px",
                      background: "red",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      padding: "2px 6px",
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
                  <img
                    src={cert.certificateData}
                    alt="Certificate"
                    style={{ width: "100%", borderRadius: "6px" }}
                  />
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
