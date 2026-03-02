import React, { useState } from "react";
import CertificateGenerator from "./CertificateGenerator.jsx";
import SavedCertificates from "./SavedCertificates.jsx";

function App() {
  const [viewSaved, setViewSaved] = useState(false);

  return (
    <div>
      <button
        onClick={() => setViewSaved(!viewSaved)}
        style={{
          margin: "20px",
          padding: "10px 20px",
          borderRadius: "8px",
          background: "#3b82f6",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        {viewSaved
          ? "Вернуться к генератору"
          : "Посмотреть сохранённые сертификаты"}
      </button>

      {viewSaved ? <SavedCertificates /> : <CertificateGenerator />}
    </div>
  );
}

export default App;
