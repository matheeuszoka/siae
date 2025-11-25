package br.com.mgctecnologia.siae.api.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.ManyToAny;
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

    @Column(nullable = false, length = 200)
    private String nomeBeneficiado;

    @Column(insertable=false, updatable=false)
    private LocalDate dataAbertura;

    @Column(nullable = true)
    private Integer estimativa;

    @Column(name = "data_previsao", nullable = false)
    private LocalDate dataPrevisao;

    @Column(name = "data_fechamento", nullable = false)
    private LocalDate dataFechamento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "setor_destino")
    private Setor setor;

    @ManyToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "id_docs", referencedColumnName = "id_docs")
    private DocsAnexados docsAnexados;


}
