import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import CertificateGenerator from "./CertificateGenerator";
import CertificateView from "./CertificateView";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Главная страница */}
        <Route path="/" element={<CertificateGenerator />} />

        {/* Страница конкретного сертификата */}
        <Route path="/certificate/:id" element={<CertificateView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
