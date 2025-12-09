package br.com.mgctecnologia.siae.api.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.PDSignature;
import org.apache.pdfbox.pdmodel.interactive.digitalsignature.SignatureInterface;
import org.bouncycastle.cert.jcajce.JcaCertStore;
import org.bouncycastle.cms.CMSProcessableByteArray;
import org.bouncycastle.cms.CMSSignedData;
import org.bouncycastle.cms.CMSSignedDataGenerator;
import org.bouncycastle.cms.CMSTypedData;
import org.bouncycastle.cms.jcajce.JcaSignerInfoGeneratorBuilder;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.bouncycastle.operator.jcajce.JcaDigestCalculatorProviderBuilder;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.cert.Certificate;
import java.security.cert.X509Certificate;
import java.util.*;

@Service
public class AssinaturaDigitalService {

    private final CertificadoService certificadoService;

    public AssinaturaDigitalService(CertificadoService certificadoService) {
        this.certificadoService = certificadoService;
    }

    /**
     * Assina um PDF e retorna os bytes do novo arquivo assinado.
     */
    public byte[] assinarDocumento(byte[] pdfOriginalBytes) throws Exception {
        // 1. Carrega Chave e Cadeia de Certificados
        KeyStore.PrivateKeyEntry keyEntry = carregarChavePrivada();
        PrivateKey privateKey = keyEntry.getPrivateKey();
        Certificate[] chain = keyEntry.getCertificateChain();

        // 2. Carrega o PDF na memória usando PDFBox
        try (PDDocument doc = PDDocument.load(pdfOriginalBytes);
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            // 3. Cria a estrutura da assinatura no PDF
            PDSignature signature = new PDSignature();
            signature.setFilter(PDSignature.FILTER_ADOBE_PPKLITE);
            signature.setSubFilter(PDSignature.SUBFILTER_ADBE_PKCS7_DETACHED);
            signature.setName("SIAE - Sistema Integrado");
            signature.setReason("Assinatura Digital Institucional (MGC Tecnologia)");
            signature.setSignDate(Calendar.getInstance());

            // 4. Registra a interface de assinatura (Callbacks do PDFBox)
            doc.addSignature(signature, new SignatureInterface() {
                @Override
                public byte[] sign(InputStream content) throws IOException {
                    try {
                        return gerarAssinaturaPKCS7(content, privateKey, chain);
                    } catch (Exception e) {
                        throw new IOException("Erro ao gerar criptografia PKCS7", e);
                    }
                }
            });

            // 5. Salva o PDF incrementalmente (obrigatório para assinaturas digitais)
            doc.saveIncremental(baos);
            return baos.toByteArray();
        }
    }

    /**
     * Lógica "pesada" do Bouncy Castle para criar o bloco de assinatura CMS/PKCS#7.
     */
    private byte[] gerarAssinaturaPKCS7(InputStream content, PrivateKey privateKey, Certificate[] chain) throws Exception {
        List<Certificate> certList = Arrays.asList(chain);
        JcaCertStore certs = new JcaCertStore(certList);

        // Prepara o gerador de assinatura
        CMSSignedDataGenerator gen = new CMSSignedDataGenerator();

        // Configura o algorítmo (SHA256 com RSA)
        ContentSigner sha256Signer = new JcaContentSignerBuilder("SHA256withRSA").build(privateKey);

        gen.addSignerInfoGenerator(
                new JcaSignerInfoGeneratorBuilder(
                        new JcaDigestCalculatorProviderBuilder().build())
                        .build(sha256Signer, (X509Certificate) chain[0])
        );

        gen.addCertificates(certs);

        // CORREÇÃO AQUI: Usar CMSTypedData ao invés de CMSProcessable
        byte[] bytesToSign = content.readAllBytes();
        CMSTypedData msg = new CMSProcessableByteArray(bytesToSign);

        // Gera a assinatura final (false = detached / destacado)
        CMSSignedData signedData = gen.generate(msg, false);

        return signedData.getEncoded();
    }

    /**
     * Recupera a entrada completa (Chave + Certificados) do KeyStore.
     */
    private KeyStore.PrivateKeyEntry carregarChavePrivada() throws Exception {
        if (!certificadoService.existeCertificadoValido()) {
            throw new IllegalStateException("Certificado não configurado no sistema.");
        }

        String senha = certificadoService.getSenhaCertificado();
        KeyStore ks = KeyStore.getInstance("PKCS12");

        try (InputStream pfxStream = certificadoService.getPfxInputStream()) {
            ks.load(pfxStream, senha.toCharArray());
        }

        Enumeration<String> aliases = ks.aliases();
        String alias = null;
        while (aliases.hasMoreElements()) {
            String a = aliases.nextElement();
            if (ks.isKeyEntry(a)) {
                alias = a;
                break;
            }
        }

        if (alias == null) throw new IllegalStateException("Nenhuma chave encontrada.");

        return (KeyStore.PrivateKeyEntry) ks.getEntry(alias, new KeyStore.PasswordProtection(senha.toCharArray()));
    }
    public String assinarDocumento(String conteudoOriginal) throws Exception {
        // 1. Carrega as chaves (Reutiliza seu método privado existente)
        KeyStore.PrivateKeyEntry keyEntry = carregarChavePrivada();

        // 2. Converte a String para Stream de bytes
        byte[] dados = conteudoOriginal.getBytes(StandardCharsets.UTF_8);
        ByteArrayInputStream streamDados = new ByteArrayInputStream(dados);

        // 3. Gera a assinatura PKCS7 (Reutiliza seu método privado existente)
        byte[] assinaturaBytes = gerarAssinaturaPKCS7(streamDados, keyEntry.getPrivateKey(), keyEntry.getCertificateChain());

        // 4. Retorna em Base64 para o Controller
        return Base64.getEncoder().encodeToString(assinaturaBytes);
    }
}