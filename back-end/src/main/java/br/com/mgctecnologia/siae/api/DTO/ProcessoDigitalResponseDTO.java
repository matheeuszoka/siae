package br.com.mgctecnologia.siae.api.DTO;

import br.com.mgctecnologia.siae.api.model.ProcessoDigital.Setor;
import br.com.mgctecnologia.siae.api.model.ProcessoDigital.Status;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ProcessoDigitalResponseDTO {
    private Long id_processo;
    private String nomeBeneficiado;
    private String telefone;
    private LocalDate dataAbertura;
    private Integer estimativa;
    private LocalDate dataPrevisao;
    private LocalDate dataFechamento;
    private Setor setor;
    private Status status;
    private DocsAnexadosResponseDTO docsAnexados;
    private String assunto;

}