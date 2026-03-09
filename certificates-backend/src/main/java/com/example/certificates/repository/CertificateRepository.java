package com.example.certificates.repository;

import com.example.certificates.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    // Find by patient's last name (example of a custom query)
    List<Certificate> findByPatientLastNameIgnoreCase(String patientLastName);
}
