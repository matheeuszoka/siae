package br.com.mgctecnologia.siae.api.service;

import br.com.mgctecnologia.siae.api.DTO.ServidorPublicoDTO;
import br.com.mgctecnologia.siae.api.DTO.ServidorPublicoResponseDTO;
import br.com.mgctecnologia.siae.api.model.ServidorPublico;
import br.com.mgctecnologia.siae.api.repository.ServidorPublicoRepository;
import jakarta.persistence.EntityNotFoundException; // Importante para o erro
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // Importante para transações

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ServidorPublicoService {

    @Autowired
    private ServidorPublicoRepository servidorPublicoRepository;

    // Métodos de Busca existentes...
    public List<ServidorPublicoDTO> buscarLikeNome(String nomeCompleto) {
        List<ServidorPublico> servidores = servidorPublicoRepository.buscarLikeNome(nomeCompleto);
        return servidores.stream().map(ServidorPublicoDTO::new).collect(Collectors.toList());
    }

    public List<ServidorPublicoResponseDTO> listarTodos() {
        return servidorPublicoRepository.findAll()
                .stream()
                .map(ServidorPublicoResponseDTO::new)
                .collect(Collectors.toList());
    }

    // --- NOVOS MÉTODOS ---

    @Transactional
    public ServidorPublicoResponseDTO criar(ServidorPublicoDTO dto) {
        // 1. Converte DTO para Entidade
        ServidorPublico entidade = new ServidorPublico();
        entidade.setNomeCompleto(dto.getNomeCompleto());
        entidade.setTelefone(dto.getTelefone());

        // 2. Salva
        ServidorPublico salvo = servidorPublicoRepository.save(entidade);

        // 3. Retorna DTO de resposta
        return new ServidorPublicoResponseDTO(salvo);
    }

    @Transactional
    public ServidorPublicoResponseDTO atualizar(Long id, ServidorPublicoDTO dto) {
        // 1. Busca o servidor existente ou lança erro
        ServidorPublico entidade = servidorPublicoRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Servidor não encontrado com ID: " + id));

        // 2. Atualiza os dados
        entidade.setNomeCompleto(dto.getNomeCompleto());
        entidade.setTelefone(dto.getTelefone());

        // 3. O save aqui fará um UPDATE porque a entidade já tem ID
        ServidorPublico atualizado = servidorPublicoRepository.save(entidade);

        return new ServidorPublicoResponseDTO(atualizado);
    }
}