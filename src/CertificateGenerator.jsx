import React, { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import logoImg from "./assets/logo.jpg"; // путь к логотипу клиники
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

  const drawCanvas = () => {
    if (!imageObj) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = imageObj.width;
    canvas.height = imageObj.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageObj, 0, 0); // Только сертификат

    if (qrImage) {
      ctx.drawImage(qrImage, qrPosition.x, qrPosition.y, qrSize, qrSize);
    }
  };

  useEffect(() => {
    drawCanvas();
  }, [imageObj, qrImage, qrPosition]);

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
    if (!dragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setQrPosition({ x: x - qrSize / 2, y: y - qrSize / 2 });
  };

  const handleMouseUp = () => setDragging(false);

  const downloadImage = () => {
    const link = document.createElement("a");
    link.download = "medical_certificate_with_qr.png";
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  const saveToDatabase = () => {
    // Заглушка: здесь позже будет отправка на сервер
    console.log("Saving to database:", formData);
    alert("Data and certificate saved to database (mock)!");
  };

  return (
    <div className="app-wrapper">
      <div className="generator-card">
        {logoImg && (
          <a href="https://www.internationalsos.com/" alt="sos">
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
              placeholder="MM/DD/YYYY"
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
      </div>
    </div>
  );
}

export default CertificateGenerator;
