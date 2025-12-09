package br.com.mgctecnologia.siae.api.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.envers.Audited;

import java.io.Serializable;

@Data
@Entity
@Table(name = "dados_servidor")
@Audited
public class ServidorPublico implements Serializable {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_servidor")
    private Long id_servidor;

    @Column(nullable = false, length = 200, name = "nome_completo")
    private String nomeCompleto;

    @Column(nullable = false, length = 20, name = "telefone")
    private String telefone;



}
