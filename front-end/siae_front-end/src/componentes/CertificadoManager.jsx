import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    LinearProgress,
    Alert,
    Stack,
    Divider,
    TextField,
    InputAdornment,
    Grid,
    Card,
    CardContent,
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';

// Ícones
import GppGoodIcon from '@mui/icons-material/GppGood'; // Escudo Validado
import GppBadIcon from '@mui/icons-material/GppBad'; // Escudo Inválido
import KeyIcon from '@mui/icons-material/Key'; // Icone Título/Arquivo
import LockIcon from '@mui/icons-material/Lock'; // Icone Senha
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; // Upload
import SaveIcon from '@mui/icons-material/Save'; // Salvar
import DeleteIcon from '@mui/icons-material/Delete'; // Excluir
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; // Sucesso

import axios from 'axios';

const CertificadoManager = () => {
    // Estados
    const [certificado, setCertificado] = useState(null); // Dados do certificado atual vindo do banco
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState(null);

    // Form States
    const [file, setFile] = useState(null);
    const [password, setPassword] = useState('');
    // Usado para forçar o reset do input file
    const [inputKey, setInputKey] = useState(Date.now());

    // URL da API
    // DICA: Em produção, use variáveis de ambiente ou caminho relativo para evitar erros de CORS.
    const API_URL = 'http://localhost:8080/api/config/certificado';
    // Se estiver testando local sem proxy configurado no package.json,
    // pode voltar para 'http://localhost:8080/api/config/certificado'

    // 1. Buscar Certificado Atual (ao carregar a página)
    const fetchCertificado = async () => {
        setLoading(true);
        try {
            const res = await axios.get(API_URL);
            setCertificado(res.data);
        } catch (error) {
            // CORREÇÃO: Uso de ?. para evitar crash se error.response for undefined (ex: servidor offline)
            if (error.response?.status === 404) {
                setCertificado(null);
            } else {
                console.error("Erro ao buscar certificado", error);
                // Não exibe erro visual se for apenas 404, mas exibe se for erro de rede
                if (error.response?.status !== 404) {
                    setMsg({ type: 'error', text: 'Erro ao verificar status do certificado. Verifique a conexão.' });
                }
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCertificado();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // 2. Upload e Validação
    const handleSave = async () => {
        if (!file || !password) {
            setMsg({ type: 'warning', text: 'Selecione o arquivo .pfx e informe a senha.' });
            return;
        }

        setSaving(true);
        setMsg(null);

        try {
            const formData = new FormData();
            formData.append('arquivo', file);
            formData.append('senha', password);

            await axios.post(API_URL, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setMsg({ type: 'success', text: 'Certificado validado e configurado com sucesso!' });

            // Limpa o formulário
            setFile(null);
            setPassword('');
            setInputKey(Date.now()); // Força o input file a "resetar" completamente

            fetchCertificado(); // Recarrega os dados

        } catch (error) {
            console.error(error);
            const errorText = error.response?.data?.message || 'Senha incorreta ou arquivo inválido.';
            setMsg({ type: 'error', text: errorText });
        } finally {
            setSaving(false);
        }
    };

    // 3. Excluir Certificado
    const handleDelete = async () => {
        if (!window.confirm("Tem certeza que deseja remover o certificado? As assinaturas deixarão de funcionar.")) return;

        setLoading(true);
        try {
            await axios.delete(API_URL);
            setCertificado(null);
            setMsg({ type: 'info', text: 'Certificado removido.' });
        } catch (error) {
            setMsg({ type: 'error', text: 'Erro ao remover certificado.' });
        } finally {
            setLoading(false);
        }
    };

    // Utilitário para formatar data
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return new Date(dateString).toLocaleDateString('pt-BR', {
                day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit'
            });
        } catch (e) {
            return dateString;
        }
    };

    // Verifica se está vencido
    const isExpired = certificado && new Date(certificado.dataValidade) < new Date();

    return (
        <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>

                {/* Cabeçalho */}
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" mb={3} gap={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Box sx={{ p: 1.5, bgcolor: '#eff6ff', borderRadius: 2, color: '#3b82f6' }}>
                            <KeyIcon fontSize="large" />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight="bold" color="#1e293b">
                                Certificado Digital
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Configure seu certificado A1 (.pfx) para assinaturas automáticas
                            </Typography>
                        </Box>
                    </Box>

                    {/* Status Chip no Topo */}
                    {certificado && (
                        <Chip
                            icon={isExpired ? <GppBadIcon /> : <CheckCircleIcon />}
                            label={isExpired ? "Certificado Vencido" : "Certificado Ativo"}
                            color={isExpired ? "error" : "success"}
                            variant="outlined"
                            sx={{ fontWeight: 'bold', px: 1 }}
                        />
                    )}
                </Stack>

                <Divider sx={{ mb: 3 }} />

                {/* Feedback Visual */}
                {(loading || saving) && <LinearProgress sx={{ mb: 3, borderRadius: 1, height: 8 }} />}

                {msg && (
                    <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 3, borderRadius: 2 }}>
                        {msg.text}
                    </Alert>
                )}

                <Grid container spacing={4}>

                    {/* COLUNA 1: Exibição do Certificado Atual */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" sx={{fontWeight: 'bold', color: '#64748b', mb: 2, textTransform: 'uppercase', letterSpacing: 1}}>
                            Status Atual
                        </Typography>

                        {certificado ? (
                            <Card variant="outlined" sx={{ borderRadius: 2, borderColor: isExpired ? '#fca5a5' : '#bbf7d0', bgcolor: isExpired ? '#fef2f2' : '#f0fdf4' }}>
                                <CardContent>
                                    <Stack spacing={2}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <GppGoodIcon color={isExpired ? "error" : "success"} fontSize="large" />
                                            <Box>
                                                <Typography variant="h6" sx={{fontWeight: 'bold', color: '#1e293b'}}>
                                                    {certificado.nomeTitular || 'Certificado Configurado'}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Emissor: {certificado.emissor || 'ICP-Brasil'}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        <Divider />

                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Box display="flex" alignItems="center" gap={1} color="#475569">
                                                <CalendarTodayIcon fontSize="small" />
                                                <Typography variant="body2" fontWeight="500">
                                                    Vence em: {formatDate(certificado.dataValidade)}
                                                </Typography>
                                            </Box>
                                            <Tooltip title="Remover certificado">
                                                <IconButton onClick={handleDelete} color="error" size="small">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        ) : (
                            <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: '#f1f5f9', borderStyle: 'dashed', borderRadius: 2 }}>
                                <GppBadIcon sx={{ fontSize: 48, color: '#94a3b8', mb: 1 }} />
                                <Typography variant="body1" fontWeight="bold" color="#64748b">
                                    Nenhum certificado configurado
                                </Typography>
                                <Typography variant="body2" color="#94a3b8">
                                    Faça o upload ao lado para habilitar assinaturas.
                                </Typography>
                            </Paper>
                        )}
                    </Grid>

                    {/* COLUNA 2: Formulário de Upload */}
                    <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" sx={{fontWeight: 'bold', color: '#64748b', mb: 2, textTransform: 'uppercase', letterSpacing: 1}}>
                            Atualizar / Configurar Novo
                        </Typography>

                        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
                            <Stack spacing={3}>
                                {/* Input Arquivo */}
                                <Button
                                    component="label"
                                    variant="outlined"
                                    fullWidth
                                    startIcon={file ? <CheckCircleIcon color="success" /> : <CloudUploadIcon />}
                                    sx={{
                                        py: 1.5,
                                        justifyContent: 'flex-start',
                                        borderColor: file ? 'success.main' : 'rgba(0, 0, 0, 0.23)',
                                        color: file ? 'success.main' : 'inherit',
                                        bgcolor: file ? '#f0fdf4' : 'transparent',
                                        textTransform: 'none'
                                    }}
                                >
                                    {file ? file.name : "Selecionar Arquivo .PFX ou .P12"}
                                    <input
                                        key={inputKey}
                                        type="file"
                                        hidden
                                        accept=".pfx,.p12"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                setFile(e.target.files[0]);
                                            }
                                        }}
                                    />
                                </Button>

                                {/* Input Senha */}
                                <TextField
                                    label="Senha do Certificado"
                                    type="password"
                                    fullWidth
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon color="action" />
                                            </InputAdornment>
                                        ),
                                    }}
                                    helperText="A senha será testada imediatamente."
                                />

                                {/* Botão Salvar */}
                                <Button
                                    variant="contained"
                                    color="primary"
                                    size="large"
                                    startIcon={<SaveIcon />}
                                    onClick={handleSave}
                                    disabled={loading || saving || !file || !password}
                                    sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none' }}
                                >
                                    {saving ? 'Validando...' : 'Salvar e Validar'}
                                </Button>
                            </Stack>
                        </Paper>
                    </Grid>
                </Grid>

            </Paper>
        </Box>
    );
};

export default CertificadoManager;