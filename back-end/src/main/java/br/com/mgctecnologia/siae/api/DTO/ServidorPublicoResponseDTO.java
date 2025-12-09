package br.com.mgctecnologia.siae.api.DTO;

import br.com.mgctecnologia.siae.api.model.ServidorPublico;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ServidorPublicoResponseDTO {

    private Long id_servidor;
    private String nomeCompleto;
    private String telefone;

    // Construtor utilit�rio para converter Entity -> DTO facilmente
    public ServidorPublicoResponseDTO(ServidorPublico entity) {
        this.id_servidor = entity.getId_servidor();
        this.nomeCompleto = entity.getNomeCompleto();
        this.telefone = entity.getTelefone();
    }
}