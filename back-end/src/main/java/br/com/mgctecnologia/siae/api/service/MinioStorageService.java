package br.com.mgctecnologia.siae.api.service;

import io.minio.*;
import io.minio.http.Method;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.concurrent.TimeUnit;


@Service
public class MinioStorageService {

    @Autowired
    private MinioClient minioClient;

    @Value("${minio.bucket.name}")
    private String bucketName;

    public String uploadFile(MultipartFile file, String objectName) {
        try {
            // Garante que o bucket existe
            boolean found = minioClient.bucketExists(BucketExistsArgs.builder().bucket(bucketName).build());
            if (!found) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
            }

            // Realiza o upload do arquivo
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName) // Nome único do arquivo
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build());

            return objectName; // Retorna o nome do objeto que foi salvo
        } catch (Exception e) {
            throw new RuntimeException("Erro ao fazer upload para o MinIO: " + e.getMessage());
        }
    }

    public String getPresignedUrl(String objectName) {
        // Se o caminho for nulo ou vazio, retorna null (sem link)
        if (objectName == null || objectName.trim().isEmpty()) {
            return null;
        }

        try {
            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectName)
                            .expiry(2, TimeUnit.HOURS) // Link válido por 2 horas
                            .build());
        } catch (Exception e) {
            // Logar o erro é boa prática, mas aqui vamos retornar null para não quebrar a lista inteira
            System.err.println("Erro ao gerar URL para: " + objectName + " - " + e.getMessage());
            return null;
        }
    }
}