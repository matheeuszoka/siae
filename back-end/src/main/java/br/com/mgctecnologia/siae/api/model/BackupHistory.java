package br.com.mgctecnologia.siae.api.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
public class BackupHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nomeArquivo;
    private LocalDateTime dataCriacao;
    private String status; // SUCESSO, ERRO, EM_ANDAMENTO
    private Long tamanhoBytes;
    private String urlMinio; // Opcional, se quiser guardar o link direto
    private String tipo; // "MANUAL" ou "AUTOMATICO"

    @PrePersist
    public void prePersist() {
        this.dataCriacao = LocalDateTime.now();
    }
}