package br.com.mgctecnologia.siae.api.service;

import br.com.mgctecnologia.siae.api.DTO.CertificadoInfoDTO;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.*;
import java.security.KeyStore;
import java.security.cert.X509Certificate;
import java.util.Date;
import java.util.Enumeration;
import java.util.Properties;

@Service
public class CertificadoService {

    // Define onde os certificados ficarão salvos (ex: pasta do usuário/.siae/certs)
    private static final String CERT_DIR = System.getProperty("user.home") + File.separator + ".siae" + File.separator + "certs";
    private static final String PFX_FILENAME = "certificado_institucional.pfx";
    private static final String CONFIG_FILENAME = "cert_config.properties";

    public CertificadoService() {
        try {
            Files.createDirectories(Paths.get(CERT_DIR));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    /**
     * Recebe o arquivo e a senha, testa se funcionam e salva no disco.
     */
    public void configurarCertificado(MultipartFile arquivo, String senha) throws Exception {
        // 1. Validação: Tenta abrir o PFX com a senha fornecida
        KeyStore ks = KeyStore.getInstance("PKCS12");
        ks.load(arquivo.getInputStream(), senha.toCharArray());

        // 2. Extrai alias para garantir que tem chave
        Enumeration<String> aliases = ks.aliases();
        if (!aliases.hasMoreElements()) {
            throw new IllegalArgumentException("O arquivo PFX não contém chaves.");
        }

        // 3. Salva o arquivo PFX fisicamente
        Path pathPfx = Paths.get(CERT_DIR, PFX_FILENAME);
        Files.copy(arquivo.getInputStream(), pathPfx, StandardCopyOption.REPLACE_EXISTING);

        // 4. Salva a senha (e metadados para leitura rápida sem abrir o pfx toda hora)
        Properties props = new Properties();
        props.setProperty("senha", senha);

        // Pega dados do certificado para cache
        String alias = aliases.nextElement();
        X509Certificate cert = (X509Certificate) ks.getCertificate(alias);
        props.setProperty("titular", extrairCN(cert.getSubjectX500Principal().getName()));
        props.setProperty("emissor", extrairCN(cert.getIssuerX500Principal().getName()));
        props.setProperty("validade", String.valueOf(cert.getNotAfter().getTime()));

        try (FileOutputStream fos = new FileOutputStream(new File(CERT_DIR, CONFIG_FILENAME))) {
            props.store(fos, "Configuração do Certificado Digital");
        }
    }

    /**
     * Retorna as informações para o Frontend exibir no Card.
     */
    public CertificadoInfoDTO getStatusCertificado() {
        File pfxFile = new File(CERT_DIR, PFX_FILENAME);
        File configFile = new File(CERT_DIR, CONFIG_FILENAME);

        if (!pfxFile.exists() || !configFile.exists()) {
            return null; // Nenhum certificado configurado
        }

        try (FileInputStream fis = new FileInputStream(configFile)) {
            Properties props = new Properties();
            props.load(fis);

            CertificadoInfoDTO dto = new CertificadoInfoDTO();
            dto.setNomeTitular(props.getProperty("titular"));
            dto.setEmissor(props.getProperty("emissor"));
            long val = Long.parseLong(props.getProperty("validade"));
            dto.setDataValidade(new Date(val));

            // Verifica se não está vencido
            dto.setAtivo(new Date().before(dto.getDataValidade()));

            return dto;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Remove os arquivos do disco.
     */
    public void removerCertificado() {
        try {
            Files.deleteIfExists(Paths.get(CERT_DIR, PFX_FILENAME));
            Files.deleteIfExists(Paths.get(CERT_DIR, CONFIG_FILENAME));
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // --- MÉTODOS PARA USO INTERNO (Assinatura) ---

    public boolean existeCertificadoValido() {
        return new File(CERT_DIR, PFX_FILENAME).exists();
    }

    public InputStream getPfxInputStream() throws FileNotFoundException {
        return new FileInputStream(new File(CERT_DIR, PFX_FILENAME));
    }

    public String getSenhaCertificado() throws IOException {
        try (FileInputStream fis = new FileInputStream(new File(CERT_DIR, CONFIG_FILENAME))) {
            Properties props = new Properties();
            props.load(fis);
            return props.getProperty("senha");
        }
    }

    private String extrairCN(String dn) {
        if (dn == null) return "";
        for (String part : dn.split(",")) {
            if (part.trim().startsWith("CN=")) {
                return part.trim().substring(3);
            }
        }
        return dn;
    }
}