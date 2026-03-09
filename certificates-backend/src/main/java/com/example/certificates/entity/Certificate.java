package com.example.certificates.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "certificates")
public class Certificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Patient first name is required")
    @Column(name = "patient_first_name", nullable = false, length = 100)
    private String patientFirstName;

    @NotBlank(message = "Patient last name is required")
    @Column(name = "patient_last_name", nullable = false, length = 100)
    private String patientLastName;

    @NotBlank(message = "Doctor first name is required")
    @Column(name = "doctor_first_name", nullable = false, length = 100)
    private String doctorFirstName;

    @NotBlank(message = "Doctor last name is required")
    @Column(name = "doctor_last_name", nullable = false, length = 100)
    private String doctorLastName;

    @Column(name = "doctor_specialization", length = 150)
    private String doctorSpecialization;

    @Column(name = "certificate_data", columnDefinition = "TEXT")
    private String certificateData; // base64-encoded image

    // ── Getters & Setters ──────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPatientFirstName() { return patientFirstName; }
    public void setPatientFirstName(String patientFirstName) { this.patientFirstName = patientFirstName; }

    public String getPatientLastName() { return patientLastName; }
    public void setPatientLastName(String patientLastName) { this.patientLastName = patientLastName; }

    public String getDoctorFirstName() { return doctorFirstName; }
    public void setDoctorFirstName(String doctorFirstName) { this.doctorFirstName = doctorFirstName; }

    public String getDoctorLastName() { return doctorLastName; }
    public void setDoctorLastName(String doctorLastName) { this.doctorLastName = doctorLastName; }

    public String getDoctorSpecialization() { return doctorSpecialization; }
    public void setDoctorSpecialization(String doctorSpecialization) { this.doctorSpecialization = doctorSpecialization; }

    public String getCertificateData() { return certificateData; }
    public void setCertificateData(String certificateData) { this.certificateData = certificateData; }
}
