package br.com.mgctecnologia.siae.api.controller;

import br.com.mgctecnologia.siae.api.DTO.ServidorPublicoDTO;
import br.com.mgctecnologia.siae.api.DTO.ServidorPublicoResponseDTO;
import br.com.mgctecnologia.siae.api.service.ServidorPublicoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/servidor-publico")
public class ServidorPublicoController {

    @Autowired
    private ServidorPublicoService servidorPublicoService;

    // Endpoints de busca existentes...
    @GetMapping("/buscar")
    public ResponseEntity<List<ServidorPublicoDTO>> buscarPorNome(@RequestParam("nome") String nomeCompleto) {
        List<ServidorPublicoDTO> resultado = servidorPublicoService.buscarLikeNome(nomeCompleto);
        return ResponseEntity.ok(resultado);
    }

    @GetMapping
    public ResponseEntity<List<ServidorPublicoResponseDTO>> listarTodos() {
        List<ServidorPublicoResponseDTO> lista = servidorPublicoService.listarTodos();
        return ResponseEntity.ok(lista);
    }

    // --- NOVOS ENDPOINTS ---

    // Criar novo servidor: POST /servidor-publico
    @PostMapping
    public ResponseEntity<ServidorPublicoResponseDTO> criar(@RequestBody ServidorPublicoDTO dto) {
        ServidorPublicoResponseDTO novoServidor = servidorPublicoService.criar(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoServidor);
    }

    // Atualizar servidor existente: PUT /servidor-publico/{id}
    @PutMapping("/{id}")
    public ResponseEntity<ServidorPublicoResponseDTO> atualizar(
            @PathVariable Long id,
            @RequestBody ServidorPublicoDTO dto) {

        ServidorPublicoResponseDTO servidorAtualizado = servidorPublicoService.atualizar(id, dto);
        return ResponseEntity.ok(servidorAtualizado);
    }
}