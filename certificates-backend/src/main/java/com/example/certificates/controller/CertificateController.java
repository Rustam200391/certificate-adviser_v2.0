package com.example.certificates.controller;

import com.example.certificates.entity.Certificate;
import com.example.certificates.service.CertificateService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/certificates")
@CrossOrigin(origins = "http://localhost:3000") // Allow React dev server
public class CertificateController {

    private final CertificateService service;

    public CertificateController(CertificateService service) {
        this.service = service;
    }

    /**
     * GET /certificates
     * Returns all saved certificates.
     */
    @GetMapping
    public List<Certificate> getAll() {
        return service.getAll();
    }

    /**
     * GET /certificates/{id}
     * Returns a single certificate or 404.
     */
    @GetMapping("/{id}")
    public ResponseEntity<Certificate> getById(@PathVariable Long id) {
        return service.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /certificates
     * Saves a new certificate and returns it with its generated id.
     */
    @PostMapping
    public ResponseEntity<Certificate> create(@Valid @RequestBody Certificate certificate) {
        Certificate saved = service.save(certificate);
        return ResponseEntity.ok(saved);
    }

    /**
     * DELETE /certificates/{id}
     * Deletes a certificate by id.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
