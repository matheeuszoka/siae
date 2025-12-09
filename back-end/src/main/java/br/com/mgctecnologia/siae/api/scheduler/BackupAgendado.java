package br.com.mgctecnologia.siae.api.scheduler;

import br.com.mgctecnologia.siae.api.service.BackupService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class BackupAgendado {

    private final BackupService backupService;

    public BackupAgendado(BackupService backupService) {
        this.backupService = backupService;
    }

    // A Expressão Cron segue a ordem: Segundos | Minutos | Horas | Dia do Mês | Mês | Dia da Semana
    // Exemplo: 0 0 3 * * * = Às 03:00:00am de qualquer dia, qualquer mês
    @Scheduled(cron = "0 50 22 * * *")    public void executarBackupAutomatico() {
        System.out.println("--- Iniciando Backup Automático ---");
        try {
            backupService.realizarBackup("AUTOMATICO");
            System.out.println("--- Backup Automático Finalizado com Sucesso ---");
        } catch (Exception e) {
            System.err.println("--- Falha no Backup Automático: " + e.getMessage());
        }
    }
}