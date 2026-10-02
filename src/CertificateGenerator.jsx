// CertificateGenerator.jsx

import React, { useState, useRef, useEffect } from "react";
import logoImg from "./assets/logo.jpg";
import "./CertificateGenerator.css";

const getLocalCertificates = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("certificates") || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const mapApiCertificate = (certificate) => ({
  ...certificate,
  certificateData:
    typeof certificate.certificateData === "string" &&
    certificate.certificateData.length > 0 &&
    !certificate.certificateData.startsWith("data:")
      ? `data:image/png;base64,${certificate.certificateData}`
      : certificate.certificateData,
});

const getApiErrorMessage = async (response, action) => {
  let detail = "";
  const responseText = await response.text();

  try {
    const payload = JSON.parse(responseText);
    detail = payload.message || payload.error || "";
  } catch {
    detail = responseText;
  }

  if (response.status === 404) {
    return `${action}: the certificate or document was not found (HTTP 404).`;
  }

  if (response.status === 400) {
    return `${action}: the backend rejected the submitted data or file (HTTP 400).${detail ? ` ${detail}` : ""}`;
  }

  return `${action} failed (HTTP ${response.status}).${detail ? ` ${detail}` : ""}`;
};

function CertificateGenerator() {
  const canvasRef = useRef(null);
  const pdfCanvasRef = useRef(null);
  const qrDragOffsetRef = useRef({ x: 0, y: 0 });

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
  const [pdfFile, setPdfFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [pdfPageSize, setPdfPageSize] = useState(null);
  const [pdfPreviewError, setPdfPreviewError] = useState("");
  const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);
  const [qrPlacement, setQrPlacement] = useState({
    x: 0.68,
    y: 0.76,
    size: 0.12,
  });
  const [draggingQr, setDraggingQr] = useState(false);

  // =========================================================
  // SAVED CERTIFICATES
  // =========================================================

  const [certificates, setCertificates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

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
  // LOAD SAVED CERTIFICATES
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const loadCertificates = async () => {
      const apiUrl = `${
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
      }/api/certificates`;

      try {
        const response = await fetch(apiUrl);

        if (!response.ok) {
          throw new Error(
            `Certificate list request failed (HTTP ${response.status}).`,
          );
        }

        const saved = await response.json();

        if (!Array.isArray(saved)) {
          throw new Error("Certificate list response is invalid.");
        }

        if (!cancelled) {
          setCertificates(saved.map(mapApiCertificate));
        }
      } catch (error) {
        console.error("Could not load certificates from the API:", error);

        if (!cancelled) {
          setCertificates(getLocalCertificates());
        }
      }
    };

    loadCertificates();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pdfFile) {
      setPdfPageSize(null);
      setPdfPreviewError("");
      setPdfPreviewLoading(false);
      return undefined;
    }

    let cancelled = false;
    let loadingTask;
    let renderTask;
    const pdfUrl = URL.createObjectURL(pdfFile);

    setPdfPageSize(null);
    setPdfPreviewError("");
    setPdfPreviewLoading(true);

    const renderFirstPage = async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist/build/pdf.mjs");

        if (cancelled) return;

        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();

        loadingTask = pdfjsLib.getDocument({ url: pdfUrl });

        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);

        if (cancelled) return;

        if (!pdfCanvasRef.current) {
          throw new Error("PDF preview canvas is unavailable.");
        }

        const pageViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(1.5, 900 / pageViewport.width);
        const viewport = page.getViewport({ scale });

        const canvas = pdfCanvasRef.current;
        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error(
            "Could not create a canvas context for the PDF preview.",
          );
        }

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.style.width = `${pageViewport.width}px`;
        canvas.style.height = `${pageViewport.height}px`;

        setPdfPageSize({
          width: pageViewport.width,
          height: pageViewport.height,
        });

        renderTask = page.render({
          canvasContext: context,
          viewport,
        });

        await renderTask.promise;

        if (!cancelled) {
          setPdfPreviewLoading(false);
        }
      } catch (error) {
        if (
          !cancelled &&
          error?.name !== "RenderingCancelledException"
        ) {
          console.error("Could not render PDF preview:", error);
          setPdfPreviewError(
            "Could not preview this PDF. Please choose a valid PDF file.",
          );
          setPdfPreviewLoading(false);
        }
      }
    };

    renderFirstPage();

    return () => {
      cancelled = true;
      URL.revokeObjectURL(pdfUrl);
      renderTask?.cancel();
      loadingTask?.destroy();
    };
  }, [pdfFile]);

  // =========================================================
  // FORM INPUT
  // =========================================================

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;

    // ---------------------------------------------------------
    // CERTIFICATE FILES
    // ---------------------------------------------------------

    if (name === "certificateFiles") {
      const selected = Array.from(files || []);

      const supportedFiles = selected.map((file) => {
        const extension = file.name.toLowerCase().split(".").pop();
        const isPdf =
          file.type === "application/pdf" && extension === "pdf";
        const isPng =
          file.type === "image/png" && extension === "png";
        const isJpeg =
          file.type === "image/jpeg" &&
          ["jpg", "jpeg"].includes(extension);

        return {
          file,
          isPdf,
          isImage: isPng || isJpeg,
        };
      });

      const unsupportedFile = supportedFiles.find(
        ({ isPdf, isImage }) => !isPdf && !isImage,
      );

      if (unsupportedFile) {
        alert(
          "Unsupported file type. Select a PDF, PNG, or JPEG/JPG file.",
        );

        e.target.value = "";
        setSelectedFiles([]);
        setPdfFile(null);
        setImageObj(null);
        setFormData((prev) => ({
          ...prev,
          certificateFile: null,
        }));
        return;
      }

      const oversizedFile = supportedFiles.find(
        ({ file }) => file.size > 50 * 1024 * 1024,
      );

      if (oversizedFile) {
        alert(`${oversizedFile.file.name} must be 50 MB or smaller.`);

        e.target.value = "";
        setSelectedFiles([]);
        setPdfFile(null);
        setImageObj(null);
        setFormData((prev) => ({
          ...prev,
          certificateFile: null,
        }));
        return;
      }

      const imageFiles = supportedFiles.filter(
        ({ isImage }) => isImage,
      );

      const pdfFiles = supportedFiles.filter(
        ({ isPdf }) => isPdf,
      );

      if (imageFiles.length > 1 || pdfFiles.length > 1) {
        alert("Select no more than one image and one PDF.");

        e.target.value = "";
        setSelectedFiles([]);
        setPdfFile(null);
        setImageObj(null);
        setFormData((prev) => ({
          ...prev,
          certificateFile: null,
        }));
        return;
      }

      const imageFile = imageFiles[0]?.file || null;

      setSelectedFiles(selected);
      setPdfFile(pdfFiles[0]?.file || null);

      setImageObj(null);

      setQrPlacement({
        x: 0.68,
        y: 0.76,
        size: 0.12,
      });

      setFormData((prev) => ({
        ...prev,
        certificateFile: imageFile,
      }));

      if (imageFile) {
        const objectUrl = URL.createObjectURL(imageFile);
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
  // PREVIEW OPTIONAL IMAGE (WITHOUT QR)
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
  };

  useEffect(() => {
    drawCanvas();
  }, [imageObj]);

  const startQrDrag = (event) => {
    const qrRect = event.currentTarget.getBoundingClientRect();

    qrDragOffsetRef.current = {
      x: event.clientX - qrRect.left,
      y: event.clientY - qrRect.top,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingQr(true);
    event.preventDefault();
  };

  const moveQr = (event) => {
    if (
      !draggingQr ||
      !pdfCanvasRef.current ||
      !pdfPageSize
    ) {
      return;
    }

    const pageRect =
      pdfCanvasRef.current.getBoundingClientRect();

    const overlayWidth =
      qrPlacement.size *
      Math.min(pageRect.width, pageRect.height);

    const nextX =
      (event.clientX -
        pageRect.left -
        qrDragOffsetRef.current.x) /
      pageRect.width;

    const nextY =
      (event.clientY -
        pageRect.top -
        qrDragOffsetRef.current.y) /
      pageRect.height;

    const maxX = Math.max(
      0,
      1 - overlayWidth / pageRect.width,
    );

    const maxY = Math.max(
      0,
      1 - overlayWidth / pageRect.height,
    );

    setQrPlacement((current) => ({
      ...current,
      x: Math.max(0, Math.min(nextX, maxX)),
      y: Math.max(0, Math.min(nextY, maxY)),
    }));
  };

  const endQrDrag = () => setDraggingQr(false);

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

  const downloadPdf = async (certificate) => {
    const apiUrl = `${
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
    }/api/certificates/${encodeURIComponent(
      certificate.id,
    )}/document`;

    try {
      const response = await fetch(apiUrl);

      if (!response.ok) {
        alert(
          await getApiErrorMessage(response, "PDF download"),
        );
        return;
      }

      const objectUrl = URL.createObjectURL(
        await response.blob(),
      );

      const link = document.createElement("a");

      link.href = objectUrl;
      link.download =
        certificate.documentName ||
        `certificate-${certificate.id}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(
        () => URL.revokeObjectURL(objectUrl),
        60_000,
      );
    } catch (error) {
      console.error("PDF download failed:", error);

      alert(
        "Could not download the PDF. Check that the backend is running and try again.",
      );
    }
  };

  // =========================================================
  // SAVE CERTIFICATE
  // =========================================================

  const saveToDatabase = async () => {
    const dto = {
      patientFirstName: formData.patientFirstName.trim(),
      patientLastName: formData.patientLastName.trim(),
      doctorFirstName: formData.doctorFirstName.trim(),
      doctorLastName: formData.doctorLastName.trim(),
      doctorSpecialization:
        formData.doctorSpecialization.trim(),

      // Certificate issue date
      issueDate: formData.entryDate,
    };

    const requiredFields = [
      ["Patient first name", dto.patientFirstName],
      ["Patient last name", dto.patientLastName],
      ["Doctor first name", dto.doctorFirstName],
      ["Doctor last name", dto.doctorLastName],
      ["Certificate issue date", dto.issueDate],
    ];

    const missingField = requiredFields.find(
      ([, value]) => !value,
    );

    if (missingField) {
      alert(`${missingField[0]} is required.`);
      return;
    }

    const maxLengths = [
      ["Patient first name", dto.patientFirstName, 100],
      ["Patient last name", dto.patientLastName, 100],
      ["Doctor first name", dto.doctorFirstName, 100],
      ["Doctor last name", dto.doctorLastName, 100],
      [
        "Doctor specialization",
        dto.doctorSpecialization,
        150,
      ],
    ];

    const tooLongField = maxLengths.find(
      ([, value, maxLength]) => value.length > maxLength,
    );

    if (tooLongField) {
      alert(
        `${tooLongField[0]} must be ${tooLongField[2]} characters or fewer.`,
      );
      return;
    }

    if (!pdfFile) {
      alert(
        "A PDF document is required. You can optionally select a PNG or JPEG/JPG image with it.",
      );
      return;
    }

    if (
      pdfFile.type !== "application/pdf" ||
      !pdfFile.name.toLowerCase().endsWith(".pdf")
    ) {
      alert("Please select a valid PDF document.");
      return;
    }

    const certificateFile = formData.certificateFile;

    if (
      certificateFile &&
      !(
        certificateFile.type === "image/png" ||
        certificateFile.type === "image/jpeg"
      )
    ) {
      alert("The certificate image must be PNG or JPEG/JPG.");
      return;
    }

    if (pdfFile.size > 50 * 1024 * 1024) {
      alert("The PDF document must be 50 MB or smaller.");
      return;
    }

    if (
      certificateFile &&
      certificateFile.size > 50 * 1024 * 1024
    ) {
      alert(
        "The certificate image must be 50 MB or smaller.",
      );
      return;
    }

    if (certificateFile && !imageObj) {
      alert(
        "The selected image could not be loaded. Please choose a valid image file or reselect the PDF.",
      );
      return;
    }

    if (
      !pdfPageSize ||
      pdfPreviewLoading ||
      pdfPreviewError
    ) {
      alert(
        "Wait for the first page of the PDF to finish loading before saving.",
      );
      return;
    }

    let createdId = null;
    let saveStage = "create";

    const apiUrl = `${
      import.meta.env.VITE_API_BASE_URL ||
      "http://localhost:8080"
    }/api/certificates`;

    try {
      const body = new FormData();

      body.append("dto", JSON.stringify(dto));

      const response = await fetch(apiUrl, {
        method: "POST",
        body,
      });

      if (!response.ok) {
        throw new Error(
          await getApiErrorMessage(
            response,
            "Certificate creation",
          ),
        );
      }

      const savedCertificate = await response.json();

      if (savedCertificate.id == null) {
        throw new Error(
          "The certificate server did not return an ID.",
        );
      }

      createdId = savedCertificate.id;

      saveStage = "pdf";

      const pdfBody = new FormData();

      pdfBody.append("file", pdfFile);

      pdfBody.append(
        "placement",
        new Blob(
          [
            JSON.stringify({
              pageIndex: 0,
              coordinateSpace:
                "display-cropbox-top-left-normalized-v1",
              x: qrPlacement.x,
              y: qrPlacement.y,
              size: qrPlacement.size,
            }),
          ],
          {
            type: "application/json",
          },
        ),
      );

      const pdfResponse = await fetch(
        `${apiUrl}/${encodeURIComponent(
          createdId,
        )}/document`,
        {
          method: "PUT",
          body: pdfBody,
        },
      );

      if (!pdfResponse.ok) {
        throw new Error(
          await getApiErrorMessage(
            pdfResponse,
            "PDF upload",
          ),
        );
      }

      if (certificateFile) {
        saveStage = "image";

        const imageCanvas =
          document.createElement("canvas");

        imageCanvas.width = imageObj.width;
        imageCanvas.height = imageObj.height;

        imageCanvas
          .getContext("2d")
          .drawImage(imageObj, 0, 0);

        const imageBlob = await new Promise(
          (resolve, reject) => {
            imageCanvas.toBlob((blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(
                  new Error(
                    "Could not prepare the optional certificate image.",
                  ),
                );
              }
            }, "image/png");
          },
        );

        if (
          imageBlob.size >
          50 * 1024 * 1024
        ) {
          throw new Error(
            "The generated certificate image exceeds the 50 MB limit.",
          );
        }

        const imageBody = new FormData();

        imageBody.append(
          "file",
          new File(
            [imageBlob],
            "certificate.png",
            {
              type: "image/png",
            },
          ),
        );

        const imageResponse = await fetch(
          `${apiUrl}/${encodeURIComponent(
            createdId,
          )}/image`,
          {
            method: "PUT",
            body: imageBody,
          },
        );

        if (!imageResponse.ok) {
          throw new Error(
            await getApiErrorMessage(
              imageResponse,
              "Optional image upload",
            ),
          );
        }
      }

      saveStage = "refresh";

      const listResponse = await fetch(apiUrl);

      if (!listResponse.ok) {
        throw new Error(
          `Certificate list request failed (HTTP ${listResponse.status}).`,
        );
      }

      const savedCertificates =
        await listResponse.json();

      if (!Array.isArray(savedCertificates)) {
        throw new Error(
          "Certificate list response is invalid.",
        );
      }

      setCertificates(
        savedCertificates.map(mapApiCertificate),
      );

      alert(
        certificateFile
          ? "Certificate, PDF with QR, and optional image successfully saved."
          : "Certificate PDF with QR successfully saved.",
      );
    } catch (error) {
      console.error(
        "Certificate save failed:",
        error,
      );

      if (createdId != null) {
        try {
          const listResponse =
            await fetch(apiUrl);

          if (listResponse.ok) {
            const savedCertificates =
              await listResponse.json();

            if (Array.isArray(savedCertificates)) {
              setCertificates(
                savedCertificates.map(
                  mapApiCertificate,
                ),
              );
            }
          }
        } catch (refreshError) {
          console.error(
            "Could not refresh certificates after a save error:",
            refreshError,
          );
        }
      }

      if (
        createdId != null &&
        saveStage === "pdf"
      ) {
        alert(
          `Certificate ${createdId} was created, but its PDF with QR was not uploaded. ${
            error.message ||
            "The backend may be unavailable."
          }`,
        );
      } else if (
        createdId != null &&
        saveStage === "image"
      ) {
        alert(
          `Certificate ${createdId} was created and its PDF with QR was uploaded, but its optional image was not updated. ${
            error.message ||
            "The backend may be unavailable."
          }`,
        );
      } else if (
        createdId != null &&
        saveStage === "refresh"
      ) {
        alert(
          `Certificate ${createdId} was saved${
            certificateFile
              ? " with its optional image"
              : ""
          } and PDF with QR, but the certificate list could not be refreshed. ${
            error.message ||
            "The backend may be unavailable."
          }`,
        );
      } else {
        alert(
          error.message ||
            "Could not save the certificate. Check that the backend is running and try again.",
        );
      }
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

    const updated = certificates.filter(
      (cert) => cert.id !== id,
    );

    setCertificates(updated);

    // Temporary mock DB
    localStorage.setItem(
      "certificates",
      JSON.stringify(updated),
    );
  };

  // =========================================================
  // SEARCH
  // =========================================================

  const normalizedSearchTerm =
    searchTerm.trim().toLowerCase();

  const filteredCertificates =
    certificates.filter((cert) => {
      const searchableValues = [
        cert.patientFirstName,
        cert.patientLastName,
        cert.doctorFirstName,
        cert.doctorLastName,
        cert.doctorSpecialization,
      ];

      return (
        !normalizedSearchTerm ||
        searchableValues.some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(normalizedSearchTerm),
        )
      );
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
          <img
            src={logoImg}
            alt="Clinic Logo"
            className="clinic-logo"
          />
        )}

        <h1 className="main-title">
          Medical Certificate Generator
        </h1>

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
              <option value="">
                Select Specialization
              </option>

              {specializations.map(
                (specialization) => (
                  <option
                    key={specialization}
                    value={specialization}
                  >
                    {specialization}
                  </option>
                ),
              )}
            </select>

            <label>Certificate Issue Date</label>

            <input
              type="date"
              name="entryDate"
              value={formData.entryDate}
              onChange={handleInputChange}
            />

            <label>
              Certificate Expiry Date
            </label>

            <input
              type="date"
              name="certificateExpiryDate"
              value={formData.certificateExpiryDate}
              readOnly
            />

            <label>
              Primary certificate PDF (required);
              optional PNG/JPEG image
            </label>

            <input
              type="file"
              accept=".pdf,image/png,image/jpeg"
              multiple
              name="certificateFiles"
              onChange={handleInputChange}
            />

            {selectedFiles.length > 0 && (
              <ul>
                {selectedFiles.map((file) => (
                  <li
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                  >
                    {file.name} —{" "}
                    {file.type || "unknown type"} —{" "}
                    {(file.size / (1024 * 1024)).toFixed(
                      2,
                    )}{" "}
                    MB
                  </li>
                ))}
              </ul>
            )}

            {pdfFile && (
              <>
                <p>
                  PDF is the primary document. The
                  backend will add the QR to the PDF
                  at the position shown below.
                </p>

                <div className="pdf-preview-section">
                  <p>
                    Drag the QR code to the desired
                    position on the first page.
                  </p>

                  {pdfPreviewLoading && (
                    <p>
                      Loading PDF preview…
                    </p>
                  )}

                  {pdfPreviewError && (
                    <p role="alert">
                      {pdfPreviewError}
                    </p>
                  )}

                  <div
                    className="pdf-preview-page"
                    hidden={Boolean(pdfPreviewError)}
                  >
                    <canvas
                      ref={pdfCanvasRef}
                      className="pdf-preview-canvas"
                    />

                    {pdfPageSize && (
                      <div
                        className={`qr-placement-overlay${
                          draggingQr
                            ? " is-dragging"
                            : ""
                        }`}
                        style={{
                          left: `${
                            qrPlacement.x * 100
                          }%`,
                          top: `${
                            qrPlacement.y * 100
                          }%`,
                          width: `${
                            (qrPlacement.size *
                              Math.min(
                                pdfPageSize.width,
                                pdfPageSize.height,
                              )) /
                            pdfPageSize.width *
                            100
                          }%`,
                        }}
                        role="img"
                        aria-label="QR code position. Drag to move."
                        onPointerDown={startQrDrag}
                        onPointerMove={moveQr}
                        onPointerUp={endQrDrag}
                        onPointerCancel={endQrDrag}
                      >
                        <span>QR</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={saveToDatabase}
                  style={{
                    marginTop: "10px",
                  }}
                >
                  Save Certificate
                </button>
              </>
            )}
          </div>
        </div>

        {/* =================================================
            CANVAS
        ================================================= */}

        {imageObj && (
          <div className="canvas-wrapper">
            <h3>
              Optional image preview (saved without QR)
            </h3>

            <canvas ref={canvasRef} />

            <div className="button-group">
              <button onClick={downloadImage}>
                Download Image Preview
              </button>
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
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
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
              {normalizedSearchTerm &&
              filteredCertificates.length === 0 ? (
                <p role="status">
                  Ничего не найдено
                </p>
              ) : (
                filteredCertificates.map(
                  (cert) => (
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
                        onClick={() =>
                          deleteCertificate(cert.id)
                        }
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
                        <strong>
                          Patient:
                        </strong>{" "}
                        {cert.patientFirstName}{" "}
                        {cert.patientLastName}
                      </p>

                      <p>
                        <strong>
                          Doctor:
                        </strong>{" "}
                        {cert.doctorFirstName}{" "}
                        {cert.doctorLastName}
                      </p>

                      <p>
                        <strong>
                          Specialization:
                        </strong>{" "}
                        {cert.doctorSpecialization}
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

                      {cert.documentName && (
                        <button
                          onClick={() =>
                            downloadPdf(cert)
                          }
                          style={{
                            display: "block",
                            marginTop: "10px",
                          }}
                        >
                          Download PDF
                        </button>
                      )}
                    </div>
                  ),
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CertificateGenerator;