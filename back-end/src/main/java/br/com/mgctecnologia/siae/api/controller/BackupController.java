package br.com.mgctecnologia.siae.api.controller;

import br.com.mgctecnologia.siae.api.model.BackupHistory;
import br.com.mgctecnologia.siae.api.service.BackupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.InputStream;
import java.util.List;

@RestController
@RequestMapping("/api/backups")
@CrossOrigin("*")
public class BackupController {

    @Autowired
    private BackupService service;

    @GetMapping
    public List<BackupHistory> listar() {
        return service.listarUltimos();
    }

    @PostMapping
    public ResponseEntity<BackupHistory> criarBackup() {
        // Quando vem da API (clique do usuário), é MANUAL
        return ResponseEntity.ok(service.realizarBackup("MANUAL"));
    }
    @GetMapping("/{id}/download")
    public ResponseEntity<InputStreamResource> download(@PathVariable Long id) {
        // Busca os metadados para saber o nome do arquivo
        BackupHistory backup = service.buscarPorId(id);

        // Pega o fluxo de bytes do MinIO
        InputStream stream = service.baixarBackup(id);

        // Monta a resposta HTTP forçando o navegador a baixar
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + backup.getNomeArquivo() + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(new InputStreamResource(stream));
    }
}
