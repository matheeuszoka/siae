package br.com.mgctecnologia.siae.api.controller;

import br.com.mgctecnologia.siae.api.service.AssinaturaDigitalService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/assinatura")
public class AssinaturaController {

    private final AssinaturaDigitalService assinaturaService;

    public AssinaturaController(AssinaturaDigitalService assinaturaService) {
        this.assinaturaService = assinaturaService;
    }

    @PostMapping("/assinar")
    public ResponseEntity<?> assinarTexto(@RequestBody DocumentoDTO documento) {
        try {
            String assinatura = assinaturaService.assinarDocumento(documento.getConteudo());

            // Retorna o conteúdo original + a assinatura gerada
            return ResponseEntity.ok(new RespostaAssinaturaDTO(documento.getConteudo(), assinatura));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro: " + e.getMessage());
        }
    }

    // --- DTOs Auxiliares (podem ser movidos para pasta DTO) ---

    // DTO de Entrada
    public static class DocumentoDTO {
        private String conteudo;

        // Getters e Setters
        public String getConteudo() { return conteudo; }
        public void setConteudo(String conteudo) { this.conteudo = conteudo; }
    }

    // DTO de Saída
    public static class RespostaAssinaturaDTO {
        private String original;
        private String assinaturaBase64;

        public RespostaAssinaturaDTO(String original, String assinaturaBase64) {
            this.original = original;
            this.assinaturaBase64 = assinaturaBase64;
        }

        // Getters
        public String getOriginal() { return original; }
        public String getAssinaturaBase64() { return assinaturaBase64; }
    }
}