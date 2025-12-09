package br.com.mgctecnologia.siae.api.DTO;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class PreparacaoAssinaturaDTO {
    private String tempId;
    private String hashParaAssinar;
}