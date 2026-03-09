package com.example.certificates.service;

import com.example.certificates.entity.Certificate;
import com.example.certificates.repository.CertificateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CertificateService {

    private final CertificateRepository repository;

    public CertificateService(CertificateRepository repository) {
        this.repository = repository;
    }

    /** Return all certificates. */
    @Transactional(readOnly = true)
    public List<Certificate> getAll() {
        return repository.findAll();
    }

    /** Return a single certificate by id. */
    @Transactional(readOnly = true)
    public Optional<Certificate> getById(Long id) {
        return repository.findById(id);
    }

    /** Persist a new certificate. */
    public Certificate save(Certificate certificate) {
        return repository.save(certificate);
    }

    /** Delete a certificate by id. */
    public void delete(Long id) {
        repository.deleteById(id);
    }
}
