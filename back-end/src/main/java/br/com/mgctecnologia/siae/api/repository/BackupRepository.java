package br.com.mgctecnologia.siae.api.repository;

import br.com.mgctecnologia.siae.api.model.BackupHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BackupRepository extends JpaRepository<BackupHistory, Long> {
}
