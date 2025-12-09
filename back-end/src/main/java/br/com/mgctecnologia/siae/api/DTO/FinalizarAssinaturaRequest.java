package br.com.mgctecnologia.siae.api.DTO;

public class FinalizarAssinaturaRequest {
    private String tempId;
    private String assinaturaBase64;
    private String certificadoBase64;

    // Getters e Setters
    public String getTempId() { return tempId; }
    public void setTempId(String tempId) { this.tempId = tempId; }
    public String getAssinaturaBase64() { return assinaturaBase64; }
    public void setAssinaturaBase64(String assinaturaBase64) { this.assinaturaBase64 = assinaturaBase64; }
    public String getCertificadoBase64() { return certificadoBase64; }
    public void setCertificadoBase64(String certificadoBase64) { this.certificadoBase64 = certificadoBase64; }
}