package br.com.mgctecnologia.siae.api.controller;

import br.com.mgctecnologia.siae.api.DTO.*;
import br.com.mgctecnologia.siae.api.model.ProcessoDigital.ProcessoDigital;
import br.com.mgctecnologia.siae.api.service.ProcessoDigitalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/processos")
public class ProcessoDigitalController {

    @Autowired
    private ProcessoDigitalService processoDigitalService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProcessoDigital> criarProcesso(
            @ModelAttribute ProcessoDigitalDTO dto) {

        ProcessoDigital novoProcesso = processoDigitalService.criarNovoProcesso(dto);
        return new ResponseEntity<>(novoProcesso, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ProcessoDigitalResponseDTO>> listarTodos() {
        List<ProcessoDigitalResponseDTO> lista = processoDigitalService.listarTodos();
        return ResponseEntity.ok(lista);
    }

    // GET: Buscar por ID Específico
    // URL: http://localhost:8080/processos/1
    @GetMapping("/{id}")
    public ResponseEntity<ProcessoDigitalResponseDTO> buscarPorId(@PathVariable Long id) {
        ProcessoDigitalResponseDTO processo = processoDigitalService.buscarPorId(id);
        return ResponseEntity.ok(processo);
    }

    @PutMapping("/{id}/cancelar")
    public ResponseEntity<ProcessoDigitalResponseDTO> cancelarProcesso(
            @PathVariable Long id,
            @RequestBody ProcessoCancelamentoDTO dto) {

        ProcessoDigitalResponseDTO processoCancelado = processoDigitalService.cancelarProcesso(id, dto.getObservacao());
        return ResponseEntity.ok(processoCancelado);
    }

    @PutMapping(value = "/{id}/transferencia", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProcessoDigitalResponseDTO> transferirSetor(
            @PathVariable Long id,
            @ModelAttribute TransferenciaSetorDTO dto) {

        ProcessoDigitalResponseDTO processoAtualizado = processoDigitalService.transferirProcesso(id, dto);
        return ResponseEntity.ok(processoAtualizado);
    }

    @PutMapping(value = "/{id}/finalizar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProcessoDigitalResponseDTO> finalizarProcesso(
            @PathVariable Long id,
            @ModelAttribute FinalizarProcessoDTO dto) {

        ProcessoDigitalResponseDTO processoFinalizado = processoDigitalService.finalizarProcesso(id, dto);
        return ResponseEntity.ok(processoFinalizado);
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProcessoDigitalResponseDTO> atualizarProcesso(
            @PathVariable Long id,
            @ModelAttribute ProcessoDigitalDTO dto) {

        ProcessoDigitalResponseDTO processoAtualizado = processoDigitalService.atualizarProcesso(id, dto);
        return ResponseEntity.ok(processoAtualizado);
    }
}