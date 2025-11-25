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

    @Column(nullable = false)
    private Boolean requerimento;

    @Column(nullable = true)
    private Boolean oficio =false;

    @Column(nullable = true)
    private Boolean outros= false;



}
