package br.com.mgctecnologia.siae.api.repository;

import br.com.mgctecnologia.siae.api.model.ProcessoDigital.ProcessoDigital;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProcessoDigitalRepository extends JpaRepository<ProcessoDigital, Long> {
}
