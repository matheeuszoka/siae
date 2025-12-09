package br.com.mgctecnologia.siae.api.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.envers.Audited;

import java.io.Serializable;

@Entity
@Table(name = "docs_anexo")
@Data
@Audited
public class DocsAnexados implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_docs;

    // Tipo alterado de Boolean para String para armazenar o PATH/ObjectName do MinIO
    @Column(nullable = true, length = 512) // Adicione um tamanho suficiente
    private String reqPessoa;

    // Tipo alterado de boolean para String
    @Column(nullable = true, length = 512)
    private String memSolicitacaoJur;

    // Tipos alterados de boolean para String, ou mantenha Boolean se quiser apenas um flag de "anexado"
    // Se for anexar um arquivo, o ideal é usar String para o path
    @Column(nullable = true, length = 512)
    private String parecerJuridico;

    @Column(nullable = true, length = 512)
    private String reqDecPrefeito;

    @Column(nullable = true, length = 512)
    private String decisaoPref;

    @Column(nullable = true, length = 512)
    private String outros;

    @Column(nullable = true, length = 512)
    private String memorandoPref;

}
