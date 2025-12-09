package br.com.mgctecnologia.siae.api.repository;

import br.com.mgctecnologia.siae.api.model.ServidorPublico;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServidorPublicoRepository extends JpaRepository<ServidorPublico, Long> {

    // Método mágico do Spring Data JPA que busca por esses dois campos
    Optional<ServidorPublico> findByNomeCompletoAndTelefone(String nomeCompleto, String telefone);

    @Query(value = "select * from dados_servidor where nome_completo like %:nomeCompleto%", nativeQuery = true)
    List<ServidorPublico> buscarLikeNome(@Param("nomeCompleto") String nomeCompleto);


}