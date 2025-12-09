package br.com.mgctecnologia.siae.api.service;

import br.com.mgctecnologia.siae.api.model.BackupHistory;
import br.com.mgctecnologia.siae.api.repository.BackupRepository;
import io.minio.GetObjectArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class BackupService {

    private final BackupRepository repository;

    @Value("${minio.bucket.name}")
    private String bucketName;

    @Value("${minio.url}")
    private String minioUrl;

    @Value("${minio.access.key}")
    private String accessKey;

    @Value("${minio.secret.key}")
    private String secretKey;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    // Adicione esta propriedade no application.properties ou deixe hardcoded aqui
    // Exemplo no properties: app.database.container-name=siae-db-1
    @Value("${app.database.container-name:siae_postgres}")
    private String containerName;

    public BackupService(BackupRepository repository) {
        this.repository = repository;
    }

    public List<BackupHistory> listarUltimos() {
        return repository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "dataCriacao"));
    }

    public BackupHistory realizarBackup(String tipoBackup) {
        String dataStr = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String fileName = "backup_siae_" + dataStr + ".sql";

        // Cria o arquivo temporário no lado do JAVA (host)
        File arquivoBackup = new File(fileName);

        BackupHistory historico = new BackupHistory();
        historico.setNomeArquivo(fileName);
        historico.setTipo(tipoBackup); // <--- AQUI SALVAMOS O TIPO
        historico.setStatus("EM_ANDAMENTO");
        repository.save(historico);

        try {
            // --- ALTERAÇÃO PRINCIPAL AQUI ---
            // Em vez de chamar "pg_dump", chamamos "docker exec"
            // O comando pg_dump roda DENTRO do container, mas a saída (output)
            // é redirecionada para o arquivo local criado pelo Java.

            ProcessBuilder pb = new ProcessBuilder(
                    "docker",
                    "exec",
                    "-i", // Interativo para manter o stream aberto
                    "-e", "PGPASSWORD=" + dbPassword, // Passa a senha para dentro do container
                    containerName, // O nome do container (verifique com 'docker ps')
                    "pg_dump",
                    "-U", "admin",
                    "-F", "c", // Formato custom/comprimido
                    "-b",      // Inclui blobs
                    "-v",      // Verbose
                    "siae_docs" // Nome do banco de dados
            );

            // Redireciona a saída padrão (o conteúdo do backup) para o arquivo físico no Java
            pb.redirectOutput(arquivoBackup);

            // Redireciona erros para o console da IDE para você ver se algo der errado
            pb.redirectError(ProcessBuilder.Redirect.INHERIT);

            Process process = pb.start();
            int exitCode = process.waitFor();

            if (exitCode != 0) {
                throw new RuntimeException("Erro ao executar backup via Docker. Código de saída: " + exitCode);
            }

            // 2. Enviar para MinIO
            MinioClient minioClient = MinioClient.builder()
                    .endpoint(minioUrl)
                    .credentials(accessKey, secretKey)
                    .build();

            try (FileInputStream fis = new FileInputStream(arquivoBackup)) {
                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(bucketName)
                                .object("backups/" + fileName)
                                .stream(fis, arquivoBackup.length(), -1)
                                .contentType("application/octet-stream")
                                .build()
                );
            }

            // 3. Atualizar Status
            historico.setStatus("SUCESSO");
            historico.setTamanhoBytes(arquivoBackup.length());
            historico.setUrlMinio("backups/" + fileName);
            repository.save(historico);

        } catch (Exception e) {
            e.printStackTrace();
            historico.setStatus("ERRO: " + e.getMessage());
            repository.save(historico);
        } finally {
            // Limpa arquivo local temporário
            if (arquivoBackup.exists()) {
                arquivoBackup.delete();
            }
        }
        return historico;
    }

    public InputStream baixarBackup(Long id) {
        // 1. Acha o registro no banco
        BackupHistory backup = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Backup não encontrado"));

        try {
            // 2. Pede o stream (fluxo de dados) para o MinIO
            MinioClient minioClient = MinioClient.builder()
                    .endpoint(minioUrl)
                    .credentials(accessKey, secretKey)
                    .build();

            return minioClient.getObject(
                    GetObjectArgs.builder()
                            .bucket(bucketName)
                            .object("backups/" + backup.getNomeArquivo()) // garante o caminho correto
                            .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Erro ao baixar do MinIO: " + e.getMessage());
        }
    }

    public BackupHistory buscarPorId(Long id) {
        return repository.findById(id).orElseThrow(() -> new RuntimeException("Backup não encontrado"));
    }
}