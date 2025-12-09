package br.com.mgctecnologia.siae.api.DTO;

import br.com.mgctecnologia.siae.api.model.ProcessoDigital.Setor;
import br.com.mgctecnologia.siae.api.model.ServidorPublico;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;

@Data
public class ProcessoDigitalDTO {
    // Campos do ProcessoDigital
    private Integer estimativa;
    private Setor setor; // Se o front-end enviar a string (ex: "JURIDICO")
    private LocalDate dataAbertura;
    private String assunto;

    private ServidorPublico servidorPublico;


    // Arquivos a serem anexados (Os nomes devem corresponder aos campos do front-end)
    private MultipartFile reqPessoa;
    private MultipartFile memSolicitacaoJur;
    // ... outros arquivos se necessário
}