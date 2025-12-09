package br.com.mgctecnologia.siae.api.controller;

import io.minio.MinioClient;
import io.minio.BucketExistsArgs;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
@CrossOrigin(origins = "*") // Permite que o React acesse
public class HealthCheckController {

    @Autowired
    private DataSource dataSource;

    // Injeção baseada no seu application.properties
    @Value("${minio.url}")
    private String minioUrl;

    @Value("${minio.access.key}")
    private String minioAccessKey;

    @Value("${minio.secret.key}")
    private String minioSecretKey;

    @Value("${minio.bucket.name}")
    private String minioBucketName;

    @GetMapping
    public ResponseEntity<Map<String, ServiceStatus>> checkStatus() {
        Map<String, ServiceStatus> statusMap = new HashMap<>();

        // Verifica Banco (usa o DataSource já configurado na porta 5433)
        statusMap.put("database", checkPostgres());

        // Verifica MinIO (usa as configs injetadas)
        statusMap.put("minio", checkMinio());

        return ResponseEntity.ok(statusMap);
    }

    private ServiceStatus checkPostgres() {
        try (Connection conn = dataSource.getConnection()) {
            // Tenta validar a conexão com timeout de 2 segundos
            if (conn.isValid(2)) {
                return new ServiceStatus("PostgreSQL (siae_docs)", "Online", "localhost:5433", true);
            }
        } catch (Exception e) {
            return new ServiceStatus("PostgreSQL", "Erro: " + e.getMessage(), "localhost:5433", false);
        }
        return new ServiceStatus("PostgreSQL", "Offline", "localhost:5433", false);
    }

    private ServiceStatus checkMinio() {
        try {
            // Constrói o cliente manualmente para este teste
            MinioClient minioClient = MinioClient.builder()
                    .endpoint(minioUrl)
                    .credentials(minioAccessKey, minioSecretKey)
                    .build();

            // Teste real: Verifica se o bucket configurado existe
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(minioBucketName).build());

            String msg = found ? "Online (Bucket '" + minioBucketName + "' encontrado)" : "Online (Bucket não encontrado)";
            return new ServiceStatus("MinIO Storage", msg, minioUrl, true);

        } catch (Exception e) {
            return new ServiceStatus("MinIO Storage", "Offline / Erro de Conexão", minioUrl, false);
        }
    }

    // DTO simples para resposta JSON
    static class ServiceStatus {
        public String name;
        public String message;
        public String address;
        public boolean isUp;

        public ServiceStatus(String name, String message, String address, boolean isUp) {
            this.name = name;
            this.message = message;
            this.address = address;
            this.isUp = isUp;
        }
    }
}