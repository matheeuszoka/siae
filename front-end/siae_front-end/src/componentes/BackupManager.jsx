import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    LinearProgress,
    Alert,
    Stack,
    IconButton,
    Tooltip,
    Divider
} from '@mui/material';

// Ícones
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; // Upload Manual
import CloudDownloadIcon from '@mui/icons-material/CloudDownload'; // Download
import StorageIcon from '@mui/icons-material/Storage'; // Icone Título
import SmartToyIcon from '@mui/icons-material/SmartToy'; // Icone Automático
import TouchAppIcon from '@mui/icons-material/TouchApp'; // Icone Manual
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import RestoreIcon from '@mui/icons-material/Restore'; // Icone Data

import axios from 'axios';

const BackupManager = () => {
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);
    const [msg, setMsg] = useState(null);

    // Configuração da URL da API (Ajuste se necessário)
    const API_URL = 'http://localhost:8080/api/backups';

    // 1. Buscar lista de backups
    const fetchBackups = async () => {
        setLoading(true);
        try {
            const res = await axios.get(API_URL);
            setBackups(res.data);
        } catch (error) {
            console.error("Erro ao listar backups", error);
            setMsg({ type: 'error', text: 'Não foi possível carregar o histórico de backups.' });
        } finally {
            setLoading(false);
        }
    };

    // 2. Criar Backup Manual
    const handleCreateBackup = async () => {
        setCreating(true);
        setMsg(null);
        try {
            // O Backend já entende que POST sem parâmetros = MANUAL (ou você pode ajustar no backend)
            await axios.post(API_URL);
            setMsg({ type: 'success', text: 'Backup solicitado com sucesso! O arquivo está sendo gerado e enviado ao MinIO.' });

            // Recarrega a lista para mostrar o novo item "EM_ANDAMENTO"
            fetchBackups();
        } catch (error) {
            setMsg({ type: 'error', text: 'Erro ao iniciar backup. Verifique se o container do banco está acessível.' });
        } finally {
            setCreating(false);
        }
    };

    // 3. Download do Arquivo
    const handleDownload = (id) => {
        // Redireciona o navegador para o endpoint de download.
        // O navegador gerencia o stream e salva na pasta Downloads.
        const downloadUrl = `${API_URL}/${id}/download`;
        window.open(downloadUrl, '_blank');
    };

    // Carregar dados ao abrir a tela
    useEffect(() => {
        fetchBackups();
    }, []);

    // Função utilitária para formatar bytes (ex: 1048576 -> 1 MB)
    const formatBytes = (bytes) => {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Box sx={{ p: 3, bgcolor: '#f8fafc', minHeight: '100vh' }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>

                {/* Cabeçalho */}
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" mb={3} gap={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Box sx={{ p: 1.5, bgcolor: '#eff6ff', borderRadius: 2, color: '#3b82f6' }}>
                            <StorageIcon fontSize="large" />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight="bold" color="#1e293b">
                                Central de Backups
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Gerencie snapshots do PostgreSQL armazenados no MinIO
                            </Typography>
                        </Box>
                    </Box>

                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<CloudUploadIcon />}
                        onClick={handleCreateBackup}
                        disabled={creating}
                        sx={{ borderRadius: 2, textTransform: 'none', px: 3, py: 1, fontWeight: 'bold' }}
                    >
                        {creating ? 'Processando...' : 'Gerar Backup Agora'}
                    </Button>
                </Stack>

                <Divider sx={{ mb: 3 }} />

                {/* Feedback Visual */}
                {creating && <LinearProgress sx={{ mb: 3, borderRadius: 1, height: 8 }} />}
                {msg && (
                    <Alert severity={msg.type} onClose={() => setMsg(null)} sx={{ mb: 3, borderRadius: 2 }}>
                        {msg.text}
                    </Alert>
                )}

                {/* Tabela */}
                <TableContainer>
                    <Table sx={{ minWidth: 650 }}>
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>ORIGEM</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>DATA / HORA</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>ARQUIVO</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>TAMANHO</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#475569' }}>STATUS</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#475569' }}>AÇÕES</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>Carregando histórico...</TableCell></TableRow>
                            ) : backups.map((bkp) => (
                                <TableRow key={bkp.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>

                                    {/* Coluna: Tipo (Manual vs Automático) */}
                                    <TableCell>
                                        {bkp.tipo === 'AUTOMATICO' ? (
                                            <Chip
                                                icon={<SmartToyIcon style={{ fontSize: 16 }} />}
                                                label="Automático"
                                                size="small"
                                                sx={{ bgcolor: '#f3e8ff', color: '#9333ea', fontWeight: 600, border: '1px solid #d8b4fe' }}
                                            />
                                        ) : (
                                            <Chip
                                                icon={<TouchAppIcon style={{ fontSize: 16 }} />}
                                                label="Manual"
                                                size="small"
                                                sx={{ bgcolor: '#e0f2fe', color: '#0284c7', fontWeight: 600, border: '1px solid #bae6fd' }}
                                            />
                                        )}
                                    </TableCell>

                                    {/* Coluna: Data */}
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                                            <RestoreIcon fontSize="small" sx={{ fontSize: 16 }} />
                                            <Typography variant="body2">
                                                {new Date(bkp.dataCriacao).toLocaleString('pt-BR')}
                                            </Typography>
                                        </Box>
                                    </TableCell>

                                    {/* Coluna: Arquivo */}
                                    <TableCell>
                                        <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', p: 0.5, borderRadius: 1, display: 'inline-block' }}>
                                            {bkp.nomeArquivo}
                                        </Typography>
                                    </TableCell>

                                    {/* Coluna: Tamanho */}
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="500">
                                            {formatBytes(bkp.tamanhoBytes)}
                                        </Typography>
                                    </TableCell>

                                    {/* Coluna: Status */}
                                    <TableCell>
                                        {bkp.status === 'SUCESSO' ? (
                                            <Chip
                                                icon={<CheckCircleIcon />}
                                                label="Sucesso"
                                                size="small"
                                                color="success"
                                                variant="outlined"
                                            />
                                        ) : bkp.status === 'EM_ANDAMENTO' ? (
                                            <Chip label="Executando..." size="small" color="warning" variant="outlined" />
                                        ) : (
                                            <Tooltip title={bkp.status}>
                                                <Chip icon={<ErrorIcon />} label="Erro" size="small" color="error" variant="outlined" />
                                            </Tooltip>
                                        )}
                                    </TableCell>

                                    {/* Coluna: Ações (Download) */}
                                    <TableCell align="right">
                                        <Tooltip title="Baixar Backup (.sql)">
                                            <span>
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleDownload(bkp.id)}
                                                    disabled={bkp.status !== 'SUCESSO'}
                                                    sx={{ bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}
                                                >
                                                    <CloudDownloadIcon />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </TableCell>

                                </TableRow>
                            ))}

                            {!loading && backups.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                                        <Typography color="text.secondary">
                                            Nenhum backup encontrado. Clique em "Gerar Backup Agora" para começar.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
};

export default BackupManager;