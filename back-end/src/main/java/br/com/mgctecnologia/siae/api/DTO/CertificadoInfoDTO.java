package br.com.mgctecnologia.siae.api.DTO;

import lombok.Data;
import java.util.Date;

@Data
public class CertificadoInfoDTO {
    private String nomeTitular;
    private String emissor;
    private Date dataValidade;
    private boolean ativo; // Indica se o certificado está válido e carregado
}