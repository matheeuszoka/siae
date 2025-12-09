package br.com.mgctecnologia.siae.api.model.ProcessoDigital;

import br.com.mgctecnologia.siae.api.model.DocsAnexados;
import br.com.mgctecnologia.siae.api.model.ServidorPublico;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.envers.Audited;

import java.io.Serializable;
import java.time.LocalDate;

@Entity
@Table(name = "processo_digital")
@Data
@Audited
public class ProcessoDigital implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id_processo;

    @Column(nullable = false, length = 255)
    private String assunto;

    @Column(name = "data_abertura", nullable = false)
    private LocalDate dataAbertura;

    @Column(nullable = false)
    private Integer estimativa;

    @Column(name = "data_previsao", nullable = false)
    private LocalDate dataPrevisao;

    @Column(name = "data_fechamento", nullable = true)
    private LocalDate dataFechamento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "setor_destino")
    private Setor setor;

    @Column(nullable = true, length = 250)
    private String observacaoCancelamento;

    @ManyToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "id_docs", referencedColumnName = "id_docs")
    private DocsAnexados docsAnexados;


    @ManyToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "id_servidor", referencedColumnName = "id_servidor")
    private ServidorPublico servidorPublico;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private Status status = Status.Em_Processamento_Juridico;


}
