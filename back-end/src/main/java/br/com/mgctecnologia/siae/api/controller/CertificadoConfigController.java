package br.com.mgctecnologia.siae.api.controller;

import br.com.mgctecnologia.siae.api.DTO.CertificadoInfoDTO;
import br.com.mgctecnologia.siae.api.service.CertificadoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/config/certificado")
public class CertificadoConfigController {

    @Autowired
    private CertificadoService certificadoService;

    @GetMapping
    public ResponseEntity<CertificadoInfoDTO> getInfo() {
        CertificadoInfoDTO info = certificadoService.getStatusCertificado();
        // Se não tiver certificado, retorna 404 (tratado no front para mostrar o card vazio)
        if (info == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(info);
    }

    @PostMapping
    public ResponseEntity<?> uploadCertificado(@RequestParam("arquivo") MultipartFile arquivo,
                                               @RequestParam("senha") String senha) {
        try {
            certificadoService.configurarCertificado(arquivo, senha);
            return ResponseEntity.ok().body("{\"message\": \"Certificado configurado com sucesso!\"}");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("{\"message\": \"Senha incorreta ou arquivo inválido.\"}");
        }
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteCertificado() {
        certificadoService.removerCertificado();
        return ResponseEntity.noContent().build();
    }
}