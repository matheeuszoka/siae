package br.com.mgctecnologia.siae.api.DTO;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class FinalizarProcessoDTO {
    // O arquivo da decisão do prefeito
    private MultipartFile decisaoPrefeito;
}