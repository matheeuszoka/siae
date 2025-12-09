package br.com.mgctecnologia.siae.api.DTO;

import lombok.Data;

@Data
public class DadosAssinaturaDTO {
    // A assinatura criptográfica gerada pelo Token/Navegador (em Base64)
    private String assinatura;

    // O certificado público (X.509) do usuário para ser incluído no PDF (em Base64)
    private String certificado;
}