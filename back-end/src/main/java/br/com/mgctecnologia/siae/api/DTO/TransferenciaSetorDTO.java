package br.com.mgctecnologia.siae.api.DTO;

import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

@Data
public class TransferenciaSetorDTO {
    // Arquivos opcionais ou obrigatórios dependendo da sua regra
    private MultipartFile parecerJuridico;
    private MultipartFile memorandoPref;
}