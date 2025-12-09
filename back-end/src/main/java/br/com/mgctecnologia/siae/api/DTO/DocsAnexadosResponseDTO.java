package br.com.mgctecnologia.siae.api.DTO;

import lombok.Data;

@Data
public class DocsAnexadosResponseDTO {
    private Long id_docs;
    private String reqPessoaUrl;
    private String memSolicitacaoJurUrl;
    private String parecerJuridicoUrl;
    private String reqDecPrefeitoUrl;
    private String decisaoPrefUrl;
    private String outrosUrl;

    // ADICIONAR ESTE CAMPO:
    private String memorandoPrefUrl;
}