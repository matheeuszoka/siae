import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {format, parseISO} from 'date-fns';
import {
    Alert,
    Autocomplete,
    Box,
    Button,
    Chip,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Fade,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    InputLabel,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import {useNavigate} from 'react-router-dom';

// --- ÍCONES ---
import AddIcon from '@mui/icons-material/Add';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import BlockIcon from '@mui/icons-material/Block';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import TimerIcon from '@mui/icons-material/Timer';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import GavelIcon from '@mui/icons-material/Gavel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SaveIcon from '@mui/icons-material/Save';
import SubjectIcon from '@mui/icons-material/Subject';


// --- CONFIGURAÇÃO VISUAL (Paleta Emerald) ---
const colors = {
    primary: '#059669', // Emerald 600
    secondary: '#10b981', // Emerald 500
    bgHover: '#f0fdf4',
};

export default function ProcessosPage() {
    // 1. ESTADOS GERAIS
    const [processos, setProcessos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingSave, setLoadingSave] = useState(false);

    const [listaServidores, setListaServidores] = useState([]);

    // 2. ESTADOS DO MENU DE CONTEXTO
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedProcesso, setSelectedProcesso] = useState(null);
    const openMenu = Boolean(anchorEl);

    // 3. ESTADOS DO MODAL "NOVO PROCESSO"
    const [openModal, setOpenModal] = useState(false);
    const [formData, setFormData] = useState({
        servidorNome: '',      // NOVO
        servidorTelefone: '',  // NOVO
        assunto: '',  // NOVO
        dataAbertura: format(new Date(), 'yyyy-MM-dd'),
        dataFechamento: format(new Date(), 'yyyy-MM-dd'),
        estimativa: '',
        dataPrevisao: '',
        setor: '',
        reqPessoaFile: null,
        memSolicitacaoJurFile: null
    });

    // 6. ESTADO DO SNACKBAR (NOTIFICAÇÕES)
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success' // 'success' | 'error' | 'info' | 'warning'
    });

    // Função auxiliar para abrir o snackbar
    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({open: true, message, severity});
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar(prev => ({...prev, open: false}));
    };


    const [filterTerm, setFilterTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState(''); // '' = Todos
    const [filterDate, setFilterDate] = useState('');
    const [filterDateType, setFilterDateType] = useState('abertura'); // 'abertura' ou 'fechamento'

    // Esta variável computada (derived state) será usada na tabela
    const filteredProcessos = processos
        .filter((proc) => {
            // 1. Filtro de Texto (Nome, ID ou Setor)
            const term = filterTerm.toLowerCase();
            const matchesTerm =
                proc.nomeBeneficiado?.toLowerCase().includes(term) ||
                proc.id_processo?.toString().includes(term) ||
                proc.setor?.toLowerCase().includes(term);

            // 2. Filtro de Status
            const matchesStatus = filterStatus ? proc.status === filterStatus : true;

            // 3. Filtro de Data (Abertura ou Fechamento)
            let matchesDate = true;
            if (filterDate) {
                const dataAlvo = filterDateType === 'abertura' ? proc.dataAbertura : proc.dataFechamento;
                // Compara strings 'YYYY-MM-DD' diretamente
                matchesDate = dataAlvo === filterDate;
            }

            return matchesTerm && matchesStatus && matchesDate;
        })
        .sort((a, b) => {
            // Lógica de Prioridade: Processos "Não Finalizados" vêm primeiro
            const isInactiveA = a.status?.includes('Finalizado') || a.status?.includes('Cancelado');
            const isInactiveB = b.status?.includes('Finalizado') || b.status?.includes('Cancelado');

            if (isInactiveA === isInactiveB) {
                // Se ambos têm a mesma prioridade (ambos ativos ou ambos finalizados),
                // desempata pelo ID (mais recentes primeiro)
                return b.id_processo - a.id_processo;
            }
            // Se A for inativo e B ativo, A deve ir para baixo (return 1)
            return isInactiveA ? 1 : -1;
        });

    // Função para limpar filtros rapidamente
    const clearFilters = () => {
        setFilterTerm('');
        setFilterStatus('');
        setFilterDate('');
    };

    // ... outros estados existentes
    const [openCancelModal, setOpenCancelModal] = useState(false);
    const [cancelObservation, setCancelObservation] = useState('');
    const [loadingCancel, setLoadingCancel] = useState(false);


    // 5. ESTADOS DO MODAL "TRANSFERIR SETOR"
    const [openTransferModal, setOpenTransferModal] = useState(false);
    const [transferFiles, setTransferFiles] = useState({
        parecerJuridico: null,
        memorandoPref: null
    });
    const [loadingTransfer, setLoadingTransfer] = useState(false);


    const formatTelefone = (value) => {
        if (!value) return "";

        // Remove tudo que não é dígito
        const cleanValue = value.replace(/\D/g, '');

        // Limita a 11 dígitos (DDD + 9 dígitos)
        const limitedValue = cleanValue.substring(0, 11);

        // Aplica a máscara
        if (limitedValue.length <= 10) {
            // (XX) XXXX-XXXX
            return limitedValue
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            // (XX) XXXXX-XXXX
            return limitedValue
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{5})(\d)/, '$1-$2');
        }
    };

    // 7. ESTADOS DO MODAL "FINALIZAR PROCESSO"
    const [openFinalizeModal, setOpenFinalizeModal] = useState(false);
    const [finalizeFile, setFinalizeFile] = useState(null); // Arquivo da Decisão
    const [loadingFinalize, setLoadingFinalize] = useState(false);

    // 4. ESTADOS DE VALIDAÇÃO
    const [formErrors, setFormErrors] = useState({
        nomeBeneficiado: false
    });
// Dentro do componente ProcessosPage:
    const navigate = useNavigate();

    // --- BUSCAR DADOS (GET) ---
    useEffect(() => {
        fetchProcessos();
    }, []);

    const fetchProcessos = async () => {
        try {
            const response = await axios.get('http://localhost:8080/processos');
            setProcessos(response.data);
        } catch (error) {
            console.error("Erro ao buscar processos (API Offline?):", error);
            // Dados Mockados para visualização se a API falhar
            setProcessos([]);
        } finally {
            setLoading(false);
        }
    };

    // --- MANIPULAÇÃO DO FORMULÁRIO ---
    const handleInputChange = (e) => {
        const {name, value} = e.target;
        let finalValue = value;

        // VERIFICAÇÃO NOVA: Se for telefone, aplica a máscara
        if (name === 'servidorTelefone') {
            finalValue = formatTelefone(value);
        }

        setFormData(prev => {
            const newData = {...prev, [name]: finalValue};
            return newData;
        });
    };

    // Função específica para o Autocomplete mudar nome e telefone
    const handleServidorChange = (event, newValue) => {
        if (typeof newValue === 'string') {
            // Se o usuário digitou um nome novo (FreeSolo)
            setFormData(prev => ({...prev, servidorNome: newValue}));
        } else if (newValue && newValue.nomeCompleto) {
            // Se o usuário selecionou da lista
            setFormData(prev => ({
                ...prev,
                servidorNome: newValue.nomeCompleto,
                servidorTelefone: newValue.telefone
            }));
        } else {
            // Se limpou o campo
            setFormData(prev => ({...prev, servidorNome: '', servidorTelefone: ''}));
        }
    };

    const fetchServidores = async (query) => {
        if (query.length < 3) return; // Só busca se tiver 3 caracteres
        try {
            // Note o uso do parâmetro query string "?nome="
            const response = await axios.get(`http://localhost:8080/servidor-publico/buscar?nome=${query}`);
            setListaServidores(response.data); // O backend agora retorna o array de DTOs correto
        } catch (error) {
            console.error("Erro ao buscar servidores", error);
        }
    };


    const handleFileChange = (e) => {
        const {name, files} = e.target;
        if (files && files[0]) {
            // Validação de tamanho (5MB)
            if (files[0].size > 10 * 1024 * 1024) {
                alert('Arquivo muito grande. Tamanho máximo: 10MB');
                return;
            }
            setFormData(prev => ({...prev, [name]: files[0]}));
        }
    };

    const isFormValid = () => {
        return (
            formData.servidorNome?.trim().length >= 3 && // Validar Nome
            formData.servidorTelefone?.trim().length >= 8 && // Validar Telefone
            formData.assunto?.trim().length > 0 && // <--- ADICIONE ESTA LINHA
            formData.setor &&
            formData.dataAbertura &&
            formData.estimativa > 0 &&
            formData.reqPessoaFile &&
            formData.memSolicitacaoJurFile
        );
    };

    // Verifica se o processo selecionado permite edições
    const isEditable = selectedProcesso &&
        !selectedProcesso.status.includes('Cancelado') &&
        !selectedProcesso.status.includes('Finalizado');

    const resetForm = () => {
        setFormData({
            servidorNome: '',
            servidorTelefone: '',
            assunto: '',
            dataAbertura: format(new Date(), 'yyyy-MM-dd'),
            estimativa: '',
            setor: '',
            reqPessoaFile: null,
            memSolicitacaoJurFile: null
        });
        setFormErrors({servidorNome: false, servidorTelefone: false});
    };

    const handleSaveProcesso = async () => {
        if (!isFormValid()) {
            showSnackbar('Por favor, preencha todos os campos obrigatórios.', 'warning'); // <-- Alterado
            return;
        }

        setLoadingSave(true);
        try {
            const dataToSend = new FormData();

            // --- CORREÇÃO AQUI ---
            // Em vez de criar um JSON string, enviamos campo por campo.
            // O @ModelAttribute do Java mapeia isso automaticamente pelo nome.
            dataToSend.append('servidorPublico.nomeCompleto', formData.servidorNome);
            dataToSend.append('servidorPublico.telefone', formData.servidorTelefone);
            dataToSend.append('assunto', formData.assunto);
            dataToSend.append('setor', formData.setor);
            dataToSend.append('dataAbertura', formData.dataAbertura);
            dataToSend.append('estimativa', formData.estimativa); // Agora o Java vai ler este campo!
            dataToSend.append('status', 'Em_Processamento_Juridico');


            // Anexa os Arquivos
            if (formData.reqPessoaFile) {
                dataToSend.append('reqPessoa', formData.reqPessoaFile);
            }
            if (formData.memSolicitacaoJurFile) {
                dataToSend.append('memSolicitacaoJur', formData.memSolicitacaoJurFile);
            }

            await axios.post('http://localhost:8080/processos', dataToSend, {
                headers: {'Content-Type': 'multipart/form-data'}
            });

            setOpenModal(false);
            fetchProcessos();
            resetForm();
            showSnackbar('Processo criado com sucesso!', 'success'); // <-- Sucesso
        } catch (error) {
            console.error("Erro ao salvar:", error);
            showSnackbar('Erro ao criar o processo. Verifique os dados.', 'error'); // <-- Erro
        } finally {
            setLoadingSave(false);
        }
    };

    const handleClose = () => {
        if (!loadingSave) {
            setOpenModal(false);
            resetForm();
        }
    };

    // --- LÓGICA DO MENU DE CONTEXTO ---
    const handleRowClick = (event, processo) => {
        setAnchorEl(event.currentTarget);
        setSelectedProcesso(processo);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setSelectedProcesso(null);
    };

    const handleAction = (action) => {
        setAnchorEl(null);

        if (selectedProcesso) {
            if (action === 'detalhes') {
                navigate(`/processos/detalhes/${selectedProcesso.id_processo}`);
            } else if (action === 'cancelar') {
                setCancelObservation('');
                setOpenCancelModal(true);
            } else if (action === 'transferir') {
                setTransferFiles({parecerJuridico: null, memorandoPref: null});
                setOpenTransferModal(true);
            } else if (action === 'finalizar') {
                // --- NOVO: Limpa arquivo e abre modal de finalização ---
                setFinalizeFile(null);
                setOpenFinalizeModal(true);
            } else {
                console.log(`Ação ${action} no ID ${selectedProcesso.id_processo}`);
            }
        }
    };
    const handleConfirmCancel = async () => {
        if (!selectedProcesso) return;

        if (cancelObservation.trim().length < 5) {
            showSnackbar('Insira uma observação válida (mínimo 5 caracteres).', 'warning'); // <-- Aviso
            return;
        }

        setLoadingCancel(true);
        try {
            await axios.put(`http://localhost:8080/processos/${selectedProcesso.id_processo}/cancelar`, {
                observacao: cancelObservation
            });

            setOpenCancelModal(false);
            fetchProcessos();
            showSnackbar('Processo cancelado com sucesso.', 'success'); // <-- Sucesso
        } catch (error) {
            console.error("Erro ao cancelar:", error);
            const msg = error.response?.data?.message || "Erro ao cancelar processo.";
            showSnackbar(msg, 'error'); // <-- Erro
        } finally {
            setLoadingCancel(false);
        }
    };

    // --- LÓGICA DE TRANSFERÊNCIA ---

    const handleTransferFileChange = (e) => {
        const {name, files} = e.target;
        if (files && files[0]) {
            if (files[0].size > 10 * 1024 * 1024) {
                alert('Arquivo muito grande. Tamanho máximo: 10MB');
                return;
            }
            setTransferFiles(prev => ({...prev, [name]: files[0]}));
        }
    };

    const handleConfirmTransfer = async () => {
        if (!selectedProcesso) return;

        if (!transferFiles.parecerJuridico && !transferFiles.memorandoPref) {
            showSnackbar('Anexe ao menos um documento.', 'warning');
            return;
        }

        setLoadingTransfer(true);
        try {
            const dataToSend = new FormData();

            // --- ALTERAÇÃO: ENVIO DIRETO SEM ASSINATURA NO FRONT ---
            // O Backend deve detectar que é uma transferência e aplicar a assinatura
            // usando o certificado configurado no CertificadoManager.

            if (transferFiles.parecerJuridico) {
                // Envia o arquivo original
                dataToSend.append('parecerJuridico', transferFiles.parecerJuridico);
                // Flag opcional para avisar o backend para assinar (se sua lógica exigir)
                dataToSend.append('assinarParecer', 'true');
            }

            if (transferFiles.memorandoPref) {
                dataToSend.append('memorandoPref', transferFiles.memorandoPref);
                dataToSend.append('assinarMemorando', 'true');
            }

            // Envia para o endpoint de transferência
            await axios.put(`http://localhost:8080/processos/${selectedProcesso.id_processo}/transferencia`, dataToSend, {
                headers: {'Content-Type': 'multipart/form-data'}
            });

            setOpenTransferModal(false);
            fetchProcessos();
            showSnackbar('Arquivos enviados e assinados pelo servidor com sucesso!', 'success');

        } catch (error) {
            console.error("Erro na transferência:", error);
            // Tratamento de erro específico para falta de certificado
            if (error.response?.data?.message?.includes("Certificado")) {
                showSnackbar('Erro: Nenhum certificado digital configurado no sistema.', 'error');
            } else {
                showSnackbar('Erro ao transferir processo.', 'error');
            }
        } finally {
            setLoadingTransfer(false);
        }
    };
    // --- LÓGICA DE FINALIZAÇÃO ---

    const handleFinalizeFileChange = (e) => {
        const {files} = e.target;
        if (files && files[0]) {
            if (files[0].size > 10 * 1024 * 1024) {
                showSnackbar('Arquivo muito grande. Máximo 10MB.', 'warning');
                return;
            }
            setFinalizeFile(files[0]);
        }
    };

    const handleConfirmFinalize = async () => {
        if (!selectedProcesso) return;

        // Validação: Exigir a Decisão do Prefeito
        if (!finalizeFile) {
            showSnackbar("Por favor, anexe a Decisão do Prefeito para finalizar.", "warning");
            return;
        }

        setLoadingFinalize(true);
        try {
            const dataToSend = new FormData();

            // Nome exato que o Backend (DTO) espera
            dataToSend.append('decisaoPrefeito', finalizeFile);

            // Endpoint PUT /{id}/finalizar
            await axios.put(`http://localhost:8080/processos/${selectedProcesso.id_processo}/finalizar`, dataToSend, {
                headers: {'Content-Type': 'multipart/form-data'}
            });

            showSnackbar("Processo finalizado com sucesso!", "success");
            setOpenFinalizeModal(false);
            fetchProcessos(); // Atualiza a tabela e muda o status para Finalizado
        } catch (error) {
            console.error("Erro na finalização:", error);
            const msg = error.response?.data?.message || "Erro ao finalizar processo.";
            showSnackbar(msg, "error");
        } finally {
            setLoadingFinalize(false);
        }
    };

    // --- HELPERS VISUAIS ---
    const formatStatus = (status) => status ? status.replace(/_/g, ' ') : '';

    const getStatusColor = (status) => {
        if (!status) return 'default';
        if (status.includes('Finalizado') || status.includes('Deferido')) return 'success';
        if (status.includes('Cancelado')) return 'error';
        return 'warning';
    };
    const formatStatusDisplay = (status) => {
        if (!status) return 'Todos';
        return status.replace(/_/g, ' '); // Troca underlines por espaço
    };

    // --- Assinatura Digital ---

    const assinarArquivo = async (arquivoOriginal) => {
        // 1. Envia para o Backend preparar
        const formDataPrep = new FormData();
        formDataPrep.append('arquivo', arquivoOriginal);

        const resPrep = await axios.post('http://localhost:8080/assinatura/preparar', formDataPrep);
        const {tempId, hashParaAssinar} = resPrep.data;

        // 2. SIMULAÇÃO DO TOKEN (ATENÇÃO: Use Base64 Válido para testes)
        // Se você enviar texto simples como "ASSINATURA...", vai dar erro de Base64 no próximo passo.
        // Abaixo coloquei strings Base64 reais (vazias/dummy) só para passar na validação do Java.

        const assinaturaDoToken = "U2ltdWxhY2FvRGvQX3NpbmF0dXJhX0Jhc2U2NA=="; // Base64 válido de teste
        const certificadoPublico = "U2ltdWxhY2FvRGvQeGVydGlmaWNhZG9fQmFzZTY0"; // Base64 válido de teste

        // 3. Envia a assinatura para o Backend finalizar o PDF
        // CORREÇÃO AQUI: Os nomes das chaves devem ser iguais aos do DTO Java
        const resFinal = await axios.post(`http://localhost:8080/assinatura/finalizar/${tempId}`, {
            assinaturaBase64: assinaturaDoToken,  // <-- Mudou de 'assinatura' para 'assinaturaBase64'
            certificadoBase64: certificadoPublico // <-- Mudou de 'certificado' para 'certificadoBase64'
        }, {
            responseType: 'blob'
        });

        // 4. Retorna o novo arquivo...
        return new File([resFinal.data], `ASSINADO_${arquivoOriginal.name}`, {type: 'application/pdf'});
    };

    return (
        <Box sx={{p: 4}}>
            {/* 1. CABEÇALHO DA PÁGINA */}
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4}}>
                <Typography variant="h4" sx={{fontWeight: 'bold', color: '#1e293b'}}>
                    Gerenciamento de Fluxo
                </Typography>

                <Button
                    variant="contained"
                    startIcon={<AddIcon/>}
                    onClick={() => setOpenModal(true)}
                    sx={{
                        background: `linear-gradient(45deg, ${colors.primary} 30%, ${colors.secondary} 90%)`,
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        padding: '10px 24px',
                        boxShadow: '0 3px 15px rgba(16, 185, 129, 0.3)',
                        transition: 'transform 0.2s',
                        '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
                        }
                    }}
                >
                    Novo Processo
                </Button>
            </Box>

            {/* 2. TABELA DE PROCESSOS */}
            <Paper sx={{p: 2, mb: 3, borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)'}}>
                <Grid container spacing={2} alignItems="center">

                    {/* 1. Busca por Texto (Reduzi de md={4} para md={3}) */}
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Buscar..." // Texto mais curto para economizar espaço visual
                            value={filterTerm}
                            onChange={(e) => setFilterTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{color: '#94a3b8'}}/>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    {/* 2. Filtro de Status (Aumentei de md={3} para md={4}) */}
                    <Grid item xs={12} sm={6} md={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel shrink={true}>Status
                                Processo</InputLabel> {/* Adicionei shrink={true} para o label não ficar por cima */}
                            <Select
                                value={filterStatus}
                                label="Status do Processo"
                                onChange={(e) => setFilterStatus(e.target.value)}
                                displayEmpty // <--- ADICIONE ESTA PROPRIEDADE AQUI
                                renderValue={(selected) => formatStatusDisplay(selected)}
                            >
                                <MenuItem value="">
                                    Todos
                                </MenuItem>
                                {/* Itens com texto formatado e ícones coloridos (opcional) */}
                                <MenuItem value="Em_Processamento_Juridico">Em Processamento: Jurídico</MenuItem>
                                <MenuItem value="Em_Processamento_Prefeito">Em Processamento: Prefeito</MenuItem>
                                <MenuItem value="Finalizado" sx={{color: 'success.main'}}>Finalizado</MenuItem>
                                <MenuItem value="Cancelado" sx={{color: 'error.main'}}>Cancelado</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* 3. Filtro de Data (Mantive md={4}) */}
                    <Grid item xs={12} sm={5} md={4}>
                        <Stack direction="row" spacing={1}>
                            <FormControl size="small" sx={{minWidth: 110}}> {/* Aumentei minWidth levemente */}
                                <Select
                                    value={filterDateType}
                                    onChange={(e) => setFilterDateType(e.target.value)}
                                    displayEmpty
                                    inputProps={{'aria-label': 'Tipo de data'}}
                                >
                                    <MenuItem value="abertura">Abertura</MenuItem>
                                    <MenuItem value="fechamento">Fechamento</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                type="date"
                                size="small"
                                fullWidth
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                InputLabelProps={{shrink: true}}
                            />
                        </Stack>
                    </Grid>

                    {/* 4. Botão Limpar (md={1}) */}
                    <Grid item xs={12} sm={1} md={1} sx={{display: 'flex', justifyContent: 'flex-end'}}>
                        <Tooltip title="Limpar Filtros">
                            <IconButton onClick={clearFilters} size="medium" sx={{color: '#64748b'}}>
                                <ClearIcon/>
                            </IconButton>
                        </Tooltip>
                    </Grid>
                </Grid>
            </Paper>

            {/* === TABELA ATUALIZADA === */}
            <TableContainer component={Paper} sx={{borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)'}}>
                <Table>
                    <TableHead sx={{bgcolor: '#f8fafc'}}>
                        <TableRow>
                            <TableCell sx={{fontWeight: 'bold', color: '#475569'}}># ID</TableCell>
                            <TableCell sx={{fontWeight: 'bold', color: '#475569'}}>Beneficiado</TableCell>
                            <TableCell sx={{fontWeight: 'bold', color: '#475569'}}>Setor</TableCell>
                            <TableCell sx={{fontWeight: 'bold', color: '#475569'}}>Abertura</TableCell>
                            <TableCell sx={{fontWeight: 'bold', color: '#475569'}}>Previsão</TableCell>
                            <TableCell sx={{fontWeight: 'bold', color: '#475569'}}>Fechamento</TableCell>
                            <TableCell sx={{fontWeight: 'bold', color: '#475569'}}>Status</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{py: 6}}>
                                    <CircularProgress sx={{color: colors.primary}}/>
                                </TableCell>
                            </TableRow>
                        ) : filteredProcessos.length > 0 ? (
                            // AQUI ESTÁ A MUDANÇA: Usamos filteredProcessos em vez de processos
                            filteredProcessos.map((row) => (
                                <TableRow
                                    key={row.id_processo}
                                    onClick={(e) => handleRowClick(e, row)}
                                    sx={{
                                        cursor: 'pointer',
                                        '&:last-child td, &:last-child th': {border: 0},
                                        transition: 'background-color 0.2s',
                                        '&:hover': {bgcolor: colors.bgHover}
                                    }}
                                >
                                    <TableCell>{row.id_processo}</TableCell>
                                    <TableCell>{row.nomeBeneficiado}</TableCell>
                                    <TableCell>{row.setor}</TableCell>
                                    <TableCell>{row.dataAbertura ? format(parseISO(row.dataAbertura), 'dd/MM/yyyy') : '-'}</TableCell>
                                    <TableCell>{row.dataPrevisao ? format(parseISO(row.dataPrevisao), 'dd/MM/yyyy') : '-'}</TableCell>
                                    <TableCell>{row.dataFechamento ? format(parseISO(row.dataFechamento), 'dd/MM/yyyy') : '-'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={formatStatus(row.status)}
                                            color={getStatusColor(row.status)}
                                            size="small"
                                            sx={{fontWeight: 'bold'}}
                                        />
                                    </TableCell>

                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{py: 3, color: '#94a3b8'}}>
                                    Nenhum processo encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* 3. MENU DE CONTEXTO */}
            <Menu
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleAction} // Fecha ao clicar fora
                TransitionComponent={Fade}
                PaperProps={{
                    sx: {minWidth: 240, borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)'}
                }}
            >
                {/* ITEM SEMPRE VISÍVEL */}
                <MenuItem onClick={() => handleAction('detalhes')} sx={{py: 1.5}}>
                    <ListItemIcon><VisibilityIcon fontSize="small"/></ListItemIcon>
                    <ListItemText>Ver Detalhes</ListItemText>
                </MenuItem>

                {/* ITENS SOMENTE PARA PROCESSOS ATIVOS (NÃO CANCELADOS) */}
                {isEditable && (
                    <div>
                        <MenuItem onClick={() => handleAction('transferir')} sx={{py: 1.5}}>
                            <ListItemIcon><SwapHorizIcon fontSize="small"/></ListItemIcon>
                            <ListItemText>Transferir Setor</ListItemText>
                        </MenuItem>


                        <Divider/>

                        {/* Use 'finalizar' na ação e CheckCircleIcon no ícone */}
                        <MenuItem onClick={() => handleAction('finalizar')} sx={{py: 1.5, color: 'success.main'}}>
                            <ListItemIcon>
                                {/* CheckCircleIcon ou TaskAltIcon são ideais para conclusão */}
                                <CheckCircleIcon fontSize="small" color="success"/>
                            </ListItemIcon>
                            <ListItemText>Finalizar Processo</ListItemText>
                        </MenuItem>

                        <MenuItem onClick={() => handleAction('cancelar')} sx={{py: 1.5, color: '#ef4444'}}>
                            <ListItemIcon><BlockIcon fontSize="small" sx={{color: '#ef4444'}}/></ListItemIcon>
                            <ListItemText>Cancelar Processo</ListItemText>
                        </MenuItem>
                    </div>
                )}
            </Menu>

            {/* --- MODAL (DIALOG) REESTRUTURADO COM MELHORIAS --- */}
            <Dialog
                open={openModal}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                aria-labelledby="dialog-title"
                aria-describedby="dialog-description"
                PaperProps={{
                    sx: {
                        borderRadius: '20px',
                        boxShadow: '0px 10px 40px rgba(0,0,0,0.1)'
                    }
                }}
            >
                <DialogTitle
                    id="dialog-title"
                    sx={{
                        bgcolor: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        py: 2.5,
                        px: 3,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                        <Box sx={{bgcolor: colors.bgHover, p: 1, borderRadius: '8px', color: colors.primary}}>
                            <AddIcon aria-hidden="true"/>
                        </Box>
                        <Typography variant="h6" sx={{fontWeight: 'bold', color: '#1e293b'}}>
                            Novo Processo Digital
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={handleClose}
                        size="small"
                        disabled={loadingSave}
                        aria-label="Fechar diálogo"
                    >
                        <CloseIcon/>
                    </IconButton>
                </DialogTitle>


                <DialogContent sx={{p: 4}}>
                    <Typography
                        id="dialog-description"
                        sx={{position: 'absolute', left: '-10000px'}}
                    >
                        Formulário para criar novo processo digital com informações do beneficiado e documentação
                    </Typography>

                    {/* O componente Stack organiza tudo em uma coluna vertical com espaçamento de 3 (24px) */}
                    <Stack spacing={3}>

                        {/* ===== SEÇÃO 1: INFORMAÇÕES DO BENEFICIADO ===== */}
                        <Box>
                            <Typography
                                variant="overline"
                                sx={{color: '#94a3b8', fontWeight: 'bold', letterSpacing: 1, mb: 1, display: 'block'}}
                            >
                                Informações do Servidor Público
                            </Typography>

                            <Stack direction="row" spacing={2}>
                                {/* AUTOCOMPLETE DO NOME */}
                                <Autocomplete
                                    freeSolo
                                    fullWidth
                                    // CORREÇÃO 1: Options recebe o array do estado, não a função
                                    options={listaServidores}

                                    getOptionLabel={(option) => {
                                        if (typeof option === 'string') return option;
                                        return option.nomeCompleto;
                                    }}

                                    onChange={handleServidorChange}

                                    inputValue={formData.servidorNome}

                                    // CORREÇÃO 2: Chama a busca quando o usuário digita
                                    onInputChange={(event, newInputValue) => {
                                        // Atualiza o formulário
                                        setFormData(prev => ({...prev, servidorNome: newInputValue}));
                                        // Chama a API para buscar sugestões
                                        fetchServidores(newInputValue);
                                    }}

                                    renderOption={(props, option) => (
                                        <li {...props}>
                                            <Box>
                                                <Typography variant="body1">{option.nomeCompleto}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Tel: {option.telefone}
                                                </Typography>
                                            </Box>
                                        </li>
                                    )}
                                    // ... renderInput continua igual
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Nome do Servidor"
                                            placeholder="Busque ou digite um novo nome"
                                            required
                                            error={formData.servidorNome?.length > 0 && formData.servidorNome?.length < 3}
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: (
                                                    <>
                                                        <InputAdornment position="start">
                                                            <PersonIcon sx={{color: '#94a3b8'}}/>
                                                        </InputAdornment>
                                                        {params.InputProps.startAdornment}
                                                    </>
                                                )
                                            }}
                                        />
                                    )}
                                />
                                {/* CAMPO TELEFONE */}
                                <TextField
                                    required
                                    label="Telefone"
                                    name="servidorTelefone"
                                    value={formData.servidorTelefone}
                                    onChange={handleInputChange}
                                    placeholder="(xx) 9xxxx-xxxx"
                                    sx={{width: '40%'}} // Ocupa menos espaço que o nome
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                {/* Ícone de telefone seria ideal, usando Person como fallback ou importe PhoneIcon */}
                                                <PersonIcon sx={{color: '#94a3b8'}}/>
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                            </Stack>

                            <Typography variant="caption" sx={{color: '#64748b', mt: 0.5, display: 'block', mb: 2}}>
                                * Selecione um servidor existente para preencher automaticamente ou digite novos dados
                                para cadastrar.
                            </Typography>
                            <Stack direction="row" spacing={1}>
                                <TextField
                                    required
                                    label="Assunto"
                                    name="assunto"
                                    value={formData.assunto}
                                    onChange={handleInputChange}
                                    placeholder="Digite o Assunto"
                                    sx={{width: '100%'}} // Ocupa menos espaço que o nome
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                {/* Ícone de telefone seria ideal, usando Person como fallback ou importe PhoneIcon */}
                                                <SubjectIcon sx={{color: '#94a3b8'}}/>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Stack>
                        </Box>

                        {/* ===== SEÇÃO 2: PRAZOS E DESTINO ===== */}
                        <Box>
                            <Typography
                                variant="overline"
                                sx={{
                                    color: '#94a3b8',
                                    fontWeight: 'bold',
                                    letterSpacing: 1,
                                    mb: 1,
                                    display: 'block'
                                }}
                            >
                                Definição de Prazos e Destino
                            </Typography>
                            <Divider sx={{mb: 2}}/>

                            {/* Stack interno para agrupar os campos desta seção com espaçamento menor (2 = 16px) */}
                            <Stack spacing={2}>
                                <FormControl fullWidth required>
                                    <InputLabel>Setor Destino</InputLabel>
                                    <Select
                                        name="setor"
                                        value={formData.setor}
                                        label="Setor Destino"
                                        onChange={handleInputChange}
                                        startAdornment={
                                            <InputAdornment position="start" sx={{ml: 1}}>
                                                <FolderOpenIcon sx={{color: '#94a3b8'}} aria-hidden="true"/>
                                            </InputAdornment>
                                        }
                                    >
                                        <MenuItem value="JURIDICO">Jurídico</MenuItem>
                                        <MenuItem value="GABINETE">Gabinete</MenuItem>
                                    </Select>
                                </FormControl>

                                <TextField
                                    fullWidth
                                    required
                                    label="Abertura"
                                    type="date"
                                    name="dataAbertura"
                                    value={formData.dataAbertura}
                                    onChange={handleInputChange}
                                    InputLabelProps={{shrink: true}}
                                    inputProps={{
                                        max: new Date().toISOString().split('T')[0]
                                    }}
                                />

                                <TextField
                                    fullWidth
                                    required
                                    label="Estimativa (dias)"
                                    type="number"
                                    name="estimativa"
                                    value={formData.estimativa}
                                    onChange={handleInputChange}
                                    InputProps={{
                                        inputProps: {min: 1, max: 365},
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <TimerIcon sx={{color: '#94a3b8', fontSize: 18}} aria-hidden="true"/>
                                            </InputAdornment>
                                        ),
                                    }}
                                />


                            </Stack>
                        </Box>

                        {/* ===== SEÇÃO 3: DOCUMENTAÇÃO ===== */}
                        <Box>
                            <Typography
                                variant="overline"
                                sx={{
                                    color: '#94a3b8',
                                    fontWeight: 'bold',
                                    letterSpacing: 1,
                                    mb: 1,
                                    display: 'block'
                                }}
                            >
                                Documentação Obrigatória
                            </Typography>
                            <Divider sx={{mb: 2}}/>

                            <Stack spacing={2}>
                                <Button
                                    component="label"
                                    variant="outlined"
                                    fullWidth
                                    startIcon={
                                        formData.reqPessoaFile ?
                                            <CheckCircleIcon sx={{color: colors.primary}}/> :
                                            <PersonIcon/>
                                    }
                                    sx={{
                                        height: '60px',
                                        justifyContent: 'flex-start',
                                        bgcolor: formData.reqPessoaFile ? '#f0fdf4' : '#fff',
                                        borderColor: formData.reqPessoaFile ? colors.primary : '#e2e8f0',
                                        borderWidth: formData.reqPessoaFile ? 2 : 1,
                                        color: formData.reqPessoaFile ? colors.primary : '#64748b',
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            borderColor: colors.primary,
                                            bgcolor: formData.reqPessoaFile ? '#f0fdf4' : '#fafafa',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }
                                    }}
                                >
                                    <Box sx={{textAlign: 'left', ml: 1, flex: 1}}>
                                        <Typography variant="caption" display="block" sx={{fontWeight: 'bold'}}>
                                            Requerimento *
                                        </Typography>
                                        <Typography variant="caption" display="block"
                                                    sx={{fontSize: '0.7rem', opacity: 0.8}}>
                                            {formData.reqPessoaFile
                                                ? `✓ ${formData.reqPessoaFile.name.substring(0, 25)}${formData.reqPessoaFile.name.length > 25 ? '...' : ''}`
                                                : 'PDF ou imagem (máx 10MB)'}
                                        </Typography>
                                    </Box>
                                    <input
                                        type="file"
                                        hidden
                                        name="reqPessoaFile"
                                        onChange={handleFileChange}
                                        accept="application/pdf,image/*"
                                        aria-label="Upload do requerimento"
                                    />
                                </Button>

                                <Button
                                    component="label"
                                    variant="outlined"
                                    fullWidth
                                    startIcon={
                                        formData.memSolicitacaoJurFile ?
                                            <CheckCircleIcon sx={{color: colors.primary}}/> :
                                            <GavelIcon/>
                                    }
                                    sx={{
                                        height: '60px',
                                        justifyContent: 'flex-start',
                                        bgcolor: formData.memSolicitacaoJurFile ? '#f0fdf4' : '#fff',
                                        borderColor: formData.memSolicitacaoJurFile ? colors.primary : '#e2e8f0',
                                        borderWidth: formData.memSolicitacaoJurFile ? 2 : 1,
                                        color: formData.memSolicitacaoJurFile ? colors.primary : '#64748b',
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            borderColor: colors.primary,
                                            bgcolor: formData.memSolicitacaoJurFile ? '#f0fdf4' : '#fafafa',
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                        }
                                    }}
                                >
                                    <Box sx={{textAlign: 'left', ml: 1, flex: 1}}>
                                        <Typography variant="caption" display="block" sx={{fontWeight: 'bold'}}>
                                            Memorando *
                                        </Typography>
                                        <Typography variant="caption" display="block"
                                                    sx={{fontSize: '0.7rem', opacity: 0.8}}>
                                            {formData.memSolicitacaoJurFile
                                                ? `✓ ${formData.memSolicitacaoJurFile.name.substring(0, 25)}${formData.memSolicitacaoJurFile.name.length > 25 ? '...' : ''}`
                                                : 'Anexar Documento'}
                                        </Typography>
                                    </Box>
                                    <input
                                        type="file"
                                        hidden
                                        name="memSolicitacaoJurFile"
                                        onChange={handleFileChange}
                                        accept="application/pdf,image/*"
                                        aria-label="Upload do memorando"
                                    />
                                </Button>
                            </Stack>
                        </Box>

                    </Stack>
                </DialogContent>

                <DialogActions sx={{p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', gap: 1}}>
                    <Button
                        onClick={handleClose}
                        disabled={loadingSave}
                        sx={{color: '#64748b', fontWeight: 600}}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSaveProcesso}
                        disabled={!isFormValid() || loadingSave}
                        disableElevation
                        startIcon={loadingSave ? <CircularProgress size={20} color="inherit"/> : <SaveIcon/>}
                        sx={{
                            bgcolor: colors.primary,
                            fontWeight: 'bold',
                            px: 4,
                            py: 1,
                            borderRadius: '8px',
                            '&:hover': {bgcolor: colors.secondary},
                            '&:disabled': {bgcolor: '#cbd5e1', color: '#94a3b8'}
                        }}
                    >
                        {loadingSave ? 'Criando...' : 'Criar Processo'}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* --- MODAL DE CANCELAMENTO --- */}
            <Dialog
                open={openCancelModal}
                onClose={() => !loadingCancel && setOpenCancelModal(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{sx: {borderRadius: '16px'}}}
            >
                <DialogTitle sx={{color: '#ef4444', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1}}>
                    <BlockIcon/> Cancelar Processo
                </DialogTitle>

                <DialogContent>
                    <Typography variant="body1" sx={{mb: 2, color: '#334155'}}>
                        Tem certeza que deseja cancelar o processo <strong>#{selectedProcesso?.id_processo}</strong>?
                        Esta ação é irreversível e requer uma justificativa.
                    </Typography>

                    <TextField
                        autoFocus
                        margin="dense"
                        label="Motivo do Cancelamento"
                        placeholder="Descreva o motivo..."
                        type="text"
                        fullWidth
                        multiline
                        rows={4}
                        variant="outlined"
                        value={cancelObservation}
                        onChange={(e) => setCancelObservation(e.target.value)}
                        disabled={loadingCancel}
                    />
                </DialogContent>

                <DialogActions sx={{p: 2, bgcolor: '#f8fafc'}}>
                    <Button
                        onClick={() => setOpenCancelModal(false)}
                        disabled={loadingCancel}
                        sx={{color: '#64748b'}}
                    >
                        Voltar
                    </Button>
                    <Button
                        onClick={handleConfirmCancel}
                        variant="contained"
                        color="error"
                        disabled={loadingCancel || cancelObservation.trim().length < 5}
                        startIcon={loadingCancel ? <CircularProgress size={20} color="inherit"/> : <BlockIcon/>}
                    >
                        {loadingCancel ? 'Cancelando...' : 'Confirmar Cancelamento'}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* --- MODAL DE TRANSFERÊNCIA DE SETOR --- */}
            <Dialog
                open={openTransferModal}
                onClose={() => !loadingTransfer && setOpenTransferModal(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{sx: {borderRadius: '16px'}}}
            >
                <DialogTitle sx={{color: '#1e293b', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1}}>
                    <Box sx={{bgcolor: '#eff6ff', p: 1, borderRadius: '8px', color: '#3b82f6'}}>
                        <SwapHorizIcon/>
                    </Box>
                    Transferir Setor
                </DialogTitle>

                <DialogContent>
                    <Typography variant="body2" sx={{mb: 3, color: '#64748b'}}>
                        Transferindo processo <strong>#{selectedProcesso?.id_processo}</strong>.
                        Anexe os documentos necessários para tramitar ao próximo setor (Gabinete).
                    </Typography>

                    <Stack spacing={2}>
                        {/* Botão Parecer Jurídico */}
                        <Button
                            component="label"
                            variant="outlined"
                            fullWidth
                            startIcon={transferFiles.parecerJuridico ? <CheckCircleIcon color="success"/> :
                                <GavelIcon/>}
                            sx={{
                                justifyContent: 'flex-start', py: 1.5,
                                borderColor: transferFiles.parecerJuridico ? 'success.main' : 'divider',
                                bgcolor: transferFiles.parecerJuridico ? '#f0fdf4' : 'transparent'
                            }}
                        >
                            <Box sx={{textAlign: 'left', ml: 1}}>
                                <Typography variant="subtitle2">Parecer Jurídico</Typography>
                                <Typography variant="caption" sx={{color: 'text.secondary'}}>
                                    {transferFiles.parecerJuridico ? transferFiles.parecerJuridico.name : 'Clique para anexar (PDF)'}
                                </Typography>
                            </Box>
                            <input
                                type="file" hidden
                                name="parecerJuridico"
                                onChange={handleTransferFileChange}
                                accept="application/pdf,image/*"
                            />
                        </Button>

                        {/* Botão Memorando Prefeito */}
                        <Button
                            component="label"
                            variant="outlined"
                            fullWidth
                            startIcon={transferFiles.memorandoPref ? <CheckCircleIcon color="success"/> :
                                <AttachFileIcon/>}
                            sx={{
                                justifyContent: 'flex-start', py: 1.5,
                                borderColor: transferFiles.memorandoPref ? 'success.main' : 'divider',
                                bgcolor: transferFiles.memorandoPref ? '#f0fdf4' : 'transparent'
                            }}
                        >
                            <Box sx={{textAlign: 'left', ml: 1}}>
                                <Typography variant="subtitle2">Memorando Prefeito</Typography>
                                <Typography variant="caption" sx={{color: 'text.secondary'}}>
                                    {transferFiles.memorandoPref ? transferFiles.memorandoPref.name : 'Clique para anexar (PDF)'}
                                </Typography>
                            </Box>
                            <input
                                type="file" hidden
                                name="memorandoPref"
                                onChange={handleTransferFileChange}
                                accept="application/pdf,image/*"
                            />
                        </Button>
                    </Stack>
                </DialogContent>

                <DialogActions sx={{p: 2, bgcolor: '#f8fafc'}}>
                    <Button
                        onClick={() => setOpenTransferModal(false)}
                        disabled={loadingTransfer}
                        sx={{color: '#64748b'}}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirmTransfer}
                        variant="contained"
                        disabled={loadingTransfer}
                        startIcon={loadingTransfer ? <CircularProgress size={20} color="inherit"/> : <SwapHorizIcon/>}
                        sx={{
                            bgcolor: '#3b82f6',
                            '&:hover': {bgcolor: '#2563eb'}
                        }} // Azul para diferenciar do criar (verde) e cancelar (vermelho)
                    >
                        {loadingTransfer ? 'Transferindo...' : 'Confirmar Transferência'}
                    </Button>
                </DialogActions>
            </Dialog>
            {/* --- MODAL DE FINALIZAÇÃO DE PROCESSO --- */}
            <Dialog
                open={openFinalizeModal}
                onClose={() => !loadingFinalize && setOpenFinalizeModal(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{sx: {borderRadius: '16px'}}}
            >
                <DialogTitle sx={{color: '#059669', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1}}>
                    <Box sx={{bgcolor: '#ecfdf5', p: 1, borderRadius: '8px', color: '#059669'}}>
                        <CheckCircleIcon/>
                    </Box>
                    Finalizar Processo
                </DialogTitle>

                <DialogContent>
                    <Typography variant="body2" sx={{mb: 3, color: '#64748b'}}>
                        Você está prestes a concluir o processo <strong>#{selectedProcesso?.id_processo}</strong>.
                        Para efetivar a finalização, é obrigatório anexar a <strong>Decisão do Prefeito</strong>.
                    </Typography>

                    <Button
                        component="label"
                        variant="outlined"
                        fullWidth
                        startIcon={finalizeFile ? <CheckCircleIcon color="success"/> : <GavelIcon/>}
                        sx={{
                            justifyContent: 'flex-start', py: 2,
                            borderColor: finalizeFile ? 'success.main' : 'divider',
                            bgcolor: finalizeFile ? '#f0fdf4' : 'transparent',
                            borderStyle: 'dashed',
                            borderWidth: 2
                        }}
                    >
                        <Box sx={{textAlign: 'left', ml: 1}}>
                            <Typography variant="subtitle2" sx={{fontWeight: 'bold'}}>
                                Decisão do Prefeito *
                            </Typography>
                            <Typography variant="caption" sx={{color: 'text.secondary'}}>
                                {finalizeFile ? finalizeFile.name : 'Clique para selecionar o arquivo (PDF)'}
                            </Typography>
                        </Box>
                        <input
                            type="file" hidden
                            onChange={handleFinalizeFileChange}
                            accept="application/pdf,image/*"
                        />
                    </Button>
                </DialogContent>

                <DialogActions sx={{p: 2, bgcolor: '#f8fafc'}}>
                    <Button
                        onClick={() => setOpenFinalizeModal(false)}
                        disabled={loadingFinalize}
                        sx={{color: '#64748b'}}
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleConfirmFinalize}
                        variant="contained"
                        disabled={loadingFinalize || !finalizeFile}
                        startIcon={loadingFinalize ? <CircularProgress size={20} color="inherit"/> : <CheckCircleIcon/>}
                        sx={{
                            bgcolor: '#059669', // Verde Success
                            '&:hover': {bgcolor: '#047857'}
                        }}
                    >
                        {loadingFinalize ? 'Finalizando...' : 'Concluir Processo'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- COMPONENTE DE NOTIFICAÇÃO (SNACKBAR) --- */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000} // Fecha sozinho após 6 segundos
                onClose={handleCloseSnackbar}
                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}} // Posição: Canto inferior direito
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled" // Estilo preenchido para mais destaque
                    sx={{width: '100%', boxShadow: 3, fontWeight: 'bold'}}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

        </Box> // <-- Fechamento do Box principal
    );
}