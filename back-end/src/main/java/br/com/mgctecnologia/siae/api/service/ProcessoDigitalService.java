package br.com.mgctecnologia.siae.api.service;

import br.com.mgctecnologia.siae.api.DTO.*;
import br.com.mgctecnologia.siae.api.model.DocsAnexados;
import br.com.mgctecnologia.siae.api.model.ProcessoDigital.ProcessoDigital;
import br.com.mgctecnologia.siae.api.model.ProcessoDigital.Setor;
import br.com.mgctecnologia.siae.api.model.ProcessoDigital.Status;
import br.com.mgctecnologia.siae.api.model.ServidorPublico;
import br.com.mgctecnologia.siae.api.repository.ProcessoDigitalRepository;
import br.com.mgctecnologia.siae.api.repository.ServidorPublicoRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ProcessoDigitalService {

    @Autowired
    private ProcessoDigitalRepository processoDigitalRepository;

    @Autowired
    private ServidorPublicoRepository servidorPublicoRepository;

    @Autowired
    private MinioStorageService minioService;

    @Autowired
    private AssinaturaDigitalService assinaturaService;

    @Transactional
    public ProcessoDigital criarNovoProcesso(ProcessoDigitalDTO dto) {
        DocsAnexados docs = new DocsAnexados();
        // Garante um prefixo único para a pasta do processo
        String processoPrefix = "processo-" + UUID.randomUUID().toString() + "/";

        // 1. Requerimento (Upload simples)
        if (dto.getReqPessoa() != null && !dto.getReqPessoa().isEmpty()) {
            String safeFilename = sanitizeFilename(dto.getReqPessoa().getOriginalFilename());
            String objectName = processoPrefix + "reqPessoa-" + safeFilename;
            minioService.uploadFile(dto.getReqPessoa(), objectName);
            docs.setReqPessoa(objectName);
        }

        // 2. Memorando de Solicitação (COM ASSINATURA)
        if (dto.getMemSolicitacaoJur() != null && !dto.getMemSolicitacaoJur().isEmpty()) {
            try {
                MultipartFile arquivoOriginal = dto.getMemSolicitacaoJur();
                String safeFilename = sanitizeFilename(arquivoOriginal.getOriginalFilename());
                String objectName = processoPrefix + "memSolicitacaoJur-ASSINADO-" + safeFilename;

                // Chama o serviço para assinar (criptografar) os bytes
                byte[] bytesAssinados = assinaturaService.assinarDocumento(arquivoOriginal.getBytes());

                // Reconstrói o MultipartFile com os dados processados
                MultipartFile arquivoAssinado = new BytesMultipartFile(
                        bytesAssinados,
                        arquivoOriginal.getOriginalFilename(),
                        arquivoOriginal.getContentType()
                );

                minioService.uploadFile(arquivoAssinado, objectName);
                docs.setMemSolicitacaoJur(objectName);

            } catch (Exception e) {
                // Relança como RuntimeException para o Controller capturar
                throw new RuntimeException("Erro ao assinar Memorando Inicial: " + e.getMessage(), e);
            }
        }

        ProcessoDigital processo = new ProcessoDigital();

        if (dto.getServidorPublico() != null) {
            ServidorPublico servidorVinculado = buscarOuSalvarServidor(dto.getServidorPublico());
            processo.setServidorPublico(servidorVinculado);
        }

        processo.setEstimativa(dto.getEstimativa());
        processo.setSetor(dto.getSetor());
        processo.setDataAbertura(dto.getDataAbertura());
        processo.setAssunto(dto.getAssunto());
        processo.setDataPrevisao(calcularDiasUteis(processo.getDataAbertura(), dto.getEstimativa()));
        processo.setDocsAnexados(docs);

        return processoDigitalRepository.save(processo);
    }

    private ServidorPublico buscarOuSalvarServidor(ServidorPublico servidorInput) {
        if (servidorInput.getNomeCompleto() == null || servidorInput.getTelefone() == null) {
            throw new IllegalArgumentException("Nome e Telefone são obrigatórios para vincular o servidor.");
        }
        Optional<ServidorPublico> existente = servidorPublicoRepository
                .findByNomeCompletoAndTelefone(servidorInput.getNomeCompleto(), servidorInput.getTelefone());
        return existente.orElseGet(() -> servidorPublicoRepository.save(servidorInput));
    }

    @Transactional
    public ProcessoDigitalResponseDTO cancelarProcesso(Long id, String observacao) {
        ProcessoDigital processo = processoDigitalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Processo não encontrado: " + id));

        if (processo.getStatus() != Status.Em_Processamento_Juridico &&
                processo.getStatus() != Status.Em_Processamento_Prefeito) {
            throw new IllegalStateException("Não é possível cancelar um processo que já está " + processo.getStatus());
        }
        processo.setStatus(Status.Cancelado);
        processo.setObservacaoCancelamento(observacao);
        processo.setDataFechamento(LocalDate.now());

        return converterParaDTO(processoDigitalRepository.save(processo));
    }

    @Transactional
    public ProcessoDigitalResponseDTO transferirProcesso(Long id, TransferenciaSetorDTO dto) {
        ProcessoDigital processo = processoDigitalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Processo não encontrado: " + id));

        DocsAnexados docs = processo.getDocsAnexados();
        if (docs == null) {
            docs = new DocsAnexados();
            processo.setDocsAnexados(docs);
        }

        String processoPrefix = "processo-id-" + id + "/transferencia/";

        // 1. Parecer Jurídico
        if (dto.getParecerJuridico() != null && !dto.getParecerJuridico().isEmpty()) {
            try {
                byte[] bytesAssinados = assinaturaService.assinarDocumento(dto.getParecerJuridico().getBytes());

                String safeName = sanitizeFilename(dto.getParecerJuridico().getOriginalFilename());
                MultipartFile arquivoAssinado = new BytesMultipartFile(
                        bytesAssinados,
                        safeName,
                        dto.getParecerJuridico().getContentType()
                );

                String objectName = processoPrefix + "parecer-ASSINADO-" + safeName;
                minioService.uploadFile(arquivoAssinado, objectName);
                docs.setParecerJuridico(objectName);
            } catch (Exception e) {
                throw new RuntimeException("Erro ao assinar Parecer Jurídico: " + e.getMessage());
            }
        }

        // 2. Memorando do Prefeito
        if (dto.getMemorandoPref() != null && !dto.getMemorandoPref().isEmpty()) {
            try {
                byte[] bytesAssinados = assinaturaService.assinarDocumento(dto.getMemorandoPref().getBytes());

                String safeName = sanitizeFilename(dto.getMemorandoPref().getOriginalFilename());
                MultipartFile arquivoAssinado = new BytesMultipartFile(
                        bytesAssinados,
                        safeName,
                        dto.getMemorandoPref().getContentType()
                );

                String objectName = processoPrefix + "memorandoPref-ASSINADO-" + safeName;
                minioService.uploadFile(arquivoAssinado, objectName);
                docs.setMemorandoPref(objectName);
            } catch (Exception e) {
                throw new RuntimeException("Erro ao assinar Memorando do Prefeito: " + e.getMessage());
            }
        }

        if (processo.getStatus() == Status.Em_Processamento_Juridico) {
            processo.setStatus(Status.Em_Processamento_Prefeito);
        }
        if (processo.getSetor() == Setor.JURIDICO){
            processo.setSetor(Setor.GABINETE);
        }

        return converterParaDTO(processoDigitalRepository.save(processo));
    }

    // Em ProcessoDigitalService.java

    @Transactional
    public ProcessoDigitalResponseDTO atualizarProcesso(Long id, ProcessoDigitalDTO dto) {
        ProcessoDigital processo = processoDigitalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Processo não encontrado: " + id));

        // 1. Atualiza dados de texto simples
        if (dto.getAssunto() != null) processo.setAssunto(dto.getAssunto());
        if (dto.getSetor() != null) processo.setSetor(dto.getSetor());
        if (dto.getEstimativa() != null) processo.setEstimativa(dto.getEstimativa());
        if (dto.getDataAbertura() != null) processo.setDataAbertura(dto.getDataAbertura());

        if (dto.getEstimativa() != null || dto.getDataAbertura() != null) {
            processo.setDataPrevisao(calcularDiasUteis(processo.getDataAbertura(), processo.getEstimativa()));
        }

        // 2. Atualiza Servidor (CORREÇÃO AQUI)
        // Em vez de buscar um novo, atualizamos os dados do objeto já vinculado
        if (dto.getServidorPublico() != null) {
            ServidorPublico servidorAtual = processo.getServidorPublico();
            ServidorPublico servidorInput = dto.getServidorPublico();

            if (servidorAtual != null) {
                // ATENÇÃO: Isso altera os dados do registro no banco (UPDATE dados_servidor SET ...)
                // mantendo o mesmo ID_SERVIDOR.
                servidorAtual.setNomeCompleto(servidorInput.getNomeCompleto());
                servidorAtual.setTelefone(servidorInput.getTelefone());

                // Não precisa chamar repository.save(servidorAtual) explicitamente
                // pois o processo tem CascadeType.ALL
            } else {
                // Fallback: Se o processo estava sem servidor (null), aí sim buscamos ou criamos
                processo.setServidorPublico(buscarOuSalvarServidor(servidorInput));
            }
        }

        // 3. Lógica de Arquivos (Mantida igual)
        DocsAnexados docs = processo.getDocsAnexados();
        if (docs == null) {
            docs = new DocsAnexados();
            processo.setDocsAnexados(docs);
        }

        String processoPrefix = "processo-" + processo.getId_processo() + "/atualizacao/";

        if (dto.getReqPessoa() != null && !dto.getReqPessoa().isEmpty()) {
            String safeFilename = sanitizeFilename(dto.getReqPessoa().getOriginalFilename());
            String objectName = processoPrefix + "reqPessoa-" + safeFilename;
            minioService.uploadFile(dto.getReqPessoa(), objectName);
            docs.setReqPessoa(objectName);
        }

        if (dto.getMemSolicitacaoJur() != null && !dto.getMemSolicitacaoJur().isEmpty()) {
            try {
                MultipartFile arquivoOriginal = dto.getMemSolicitacaoJur();
                String safeFilename = sanitizeFilename(arquivoOriginal.getOriginalFilename());
                String objectName = processoPrefix + "memSolicitacaoJur-ASSINADO-" + safeFilename;

                byte[] bytesAssinados = assinaturaService.assinarDocumento(arquivoOriginal.getBytes());

                MultipartFile arquivoAssinado = new BytesMultipartFile(
                        bytesAssinados,
                        arquivoOriginal.getOriginalFilename(),
                        arquivoOriginal.getContentType()
                );

                minioService.uploadFile(arquivoAssinado, objectName);
                docs.setMemSolicitacaoJur(objectName);

            } catch (Exception e) {
                throw new RuntimeException("Erro ao assinar e atualizar Memorando: " + e.getMessage(), e);
            }
        }

        return converterParaDTO(processoDigitalRepository.save(processo));
    }

    @Transactional
    public ProcessoDigitalResponseDTO finalizarProcesso(Long id, FinalizarProcessoDTO dto) {
        ProcessoDigital processo = processoDigitalRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Processo não encontrado: " + id));

        if (processo.getStatus() == Status.Cancelado || processo.getStatus() == Status.Finalizado) {
            throw new IllegalStateException("O processo já está encerrado.");
        }

        DocsAnexados docs = processo.getDocsAnexados();
        if (docs == null) {
            docs = new DocsAnexados();
            processo.setDocsAnexados(docs);
        }

        if (dto.getDecisaoPrefeito() != null && !dto.getDecisaoPrefeito().isEmpty()) {
            try {
                String processoPrefix = "processo-id-" + id + "/finalizacao/";
                String safeName = sanitizeFilename(dto.getDecisaoPrefeito().getOriginalFilename());

                byte[] bytesAssinados = assinaturaService.assinarDocumento(dto.getDecisaoPrefeito().getBytes());

                MultipartFile arquivoAssinado = new BytesMultipartFile(
                        bytesAssinados,
                        safeName,
                        dto.getDecisaoPrefeito().getContentType()
                );

                String objectName = processoPrefix + "decisaoPrefeito-ASSINADO-" + safeName;
                minioService.uploadFile(arquivoAssinado, objectName);
                docs.setDecisaoPref(objectName);

            } catch (Exception e) {
                throw new RuntimeException("Erro ao assinar Decisão do Prefeito: " + e.getMessage());
            }
        }

        processo.setStatus(Status.Finalizado);
        processo.setDataFechamento(LocalDate.now());

        return converterParaDTO(processoDigitalRepository.save(processo));
    }

    // --- Métodos Auxiliares ---

    public List<ProcessoDigitalResponseDTO> listarTodos() {
        return processoDigitalRepository.findAll().stream().map(this::converterParaDTO).collect(Collectors.toList());
    }

    public ProcessoDigitalResponseDTO buscarPorId(Long id) {
        return converterParaDTO(processoDigitalRepository.findById(id).orElseThrow());
    }

    private ProcessoDigitalResponseDTO converterParaDTO(ProcessoDigital processo) {
        ProcessoDigitalResponseDTO dto = new ProcessoDigitalResponseDTO();
        dto.setId_processo(processo.getId_processo());
        if (processo.getServidorPublico() != null) {
            dto.setNomeBeneficiado(processo.getServidorPublico().getNomeCompleto());
            // ADICIONE ESTA LINHA:
            dto.setTelefone(processo.getServidorPublico().getTelefone());
        }

        dto.setDataAbertura(processo.getDataAbertura());
        dto.setEstimativa(processo.getEstimativa());
        dto.setDataPrevisao(processo.getDataPrevisao());
        dto.setDataFechamento(processo.getDataFechamento());
        dto.setSetor(processo.getSetor());
        dto.setStatus(processo.getStatus());
        dto.setAssunto(processo.getAssunto());

        if (processo.getDocsAnexados() != null) {
            DocsAnexados docs = processo.getDocsAnexados();
            DocsAnexadosResponseDTO docsDto = new DocsAnexadosResponseDTO();
            docsDto.setId_docs(docs.getId_docs());

            // URLs assinadas do MinIO
            docsDto.setReqPessoaUrl(minioService.getPresignedUrl(docs.getReqPessoa()));
            docsDto.setMemSolicitacaoJurUrl(minioService.getPresignedUrl(docs.getMemSolicitacaoJur()));
            docsDto.setParecerJuridicoUrl(minioService.getPresignedUrl(docs.getParecerJuridico()));
            docsDto.setDecisaoPrefUrl(minioService.getPresignedUrl(docs.getDecisaoPref()));
            docsDto.setMemorandoPrefUrl(minioService.getPresignedUrl(docs.getMemorandoPref()));

            dto.setDocsAnexados(docsDto);
        }
        return dto;
    }

    public String sanitizeFilename(String filename) {
        if (filename == null) return "arquivo_sem_nome";
        // Remove caracteres especiais, mantendo apenas letras, números, ponto, traço e underscore
        return filename.replaceAll("[^a-zA-Z0-9\\.\\-_]", "_").replaceAll("_{2,}", "_");
    }

    private LocalDate calcularDiasUteis(LocalDate dataInicial, long estimativa) {
        LocalDate dataFinal = dataInicial;
        long dias = 0;
        while (dias < estimativa) {
            dataFinal = dataFinal.plusDays(1);
            DayOfWeek d = dataFinal.getDayOfWeek();
            if (d != DayOfWeek.SATURDAY && d != DayOfWeek.SUNDAY) dias++;
        }
        return dataFinal;
    }

    // Classe interna para converter byte[] de volta para MultipartFile
    private static class BytesMultipartFile implements MultipartFile {
        private final byte[] content;
        private final String name;
        private final String contentType;

        public BytesMultipartFile(byte[] content, String name, String contentType) {
            this.content = content;
            this.name = name;
            this.contentType = contentType;
        }

        @Override public String getName() { return name; }
        @Override public String getOriginalFilename() { return name; }
        @Override public String getContentType() { return contentType; }
        @Override public boolean isEmpty() { return content == null || content.length == 0; }
        @Override public long getSize() { return content.length; }
        @Override public byte[] getBytes() throws IOException { return content; }
        @Override public InputStream getInputStream() throws IOException { return new ByteArrayInputStream(content); }
        @Override public void transferTo(File dest) throws IOException, IllegalStateException {
            try(FileOutputStream fos = new FileOutputStream(dest)) { fos.write(content); }
        }
    }
}