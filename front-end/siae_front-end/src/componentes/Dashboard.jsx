import React, { useState, useEffect } from 'react';
import {
    Box, Grid, Paper, Typography, Card, CardContent, Stack, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    LinearProgress, CircularProgress, Alert, Divider, IconButton, Tooltip
} from '@mui/material';

// Ícones de Negócio
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

// Ícones de Infraestrutura (Novos)
import DnsIcon from '@mui/icons-material/Dns'; // Banco
import CloudQueueIcon from '@mui/icons-material/CloudQueue'; // MinIO
import RefreshIcon from '@mui/icons-material/Refresh';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

const colors = {
    primary: '#052e16',
    danger: '#ef4444',
    warning: '#f59e0b',
    success: '#10b981',
    textSecondary: '#64748b',
    background: '#f8fafc'
};

// --- COMPONENTE: Widget de Status do Sistema (Novo) ---
const SystemHealthWidget = ({ health, loading, onRefresh }) => {
    const renderStatus = (label, isUp, icon) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 0.5, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Box sx={{ color: colors.textSecondary }}>{icon}</Box>
            <Box>
                <Typography variant="caption" display="block" sx={{ fontWeight: 700, color: colors.textSecondary }}>
                    {label}
                </Typography>
                <Box display="flex" alignItems="center" gap={0.5}>
                    <FiberManualRecordIcon sx={{ fontSize: 10, color: isUp ? colors.success : colors.danger }} />
                    <Typography variant="caption" sx={{ color: isUp ? colors.success : colors.danger, fontWeight: 600 }}>
                        {loading ? '...' : (isUp ? 'ONLINE' : 'OFFLINE')}
                    </Typography>
                </Box>
            </Box>
        </Box>
    );

    return (
        <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>Painel de Controle</Typography>
                <Typography variant="body2" color="text.secondary">Visão geral dos processos e saúde do sistema</Typography>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center">
                {renderStatus("PostgreSQL (5433)", health?.database?.isUp, <DnsIcon fontSize="small" />)}
                {renderStatus("MinIO S3 (9000)", health?.minio?.isUp, <CloudQueueIcon fontSize="small" />)}

                <Tooltip title="Atualizar dados">
                    <IconButton onClick={onRefresh} size="small" sx={{ bgcolor: '#eff6ff', color: '#3b82f6', '&:hover': { bgcolor: '#dbeafe' } }}>
                        <RefreshIcon />
                    </IconButton>
                </Tooltip>
            </Stack>
        </Paper>
    );
};

// --- COMPONENTE: Card de KPI (Existente) ---
const StatCard = ({ title, value, icon, color, subtext }) => (
    <Card elevation={0} sx={{ height: '100%', borderRadius: 3, border: '1px solid #e2e8f0', transition: '0.2s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' } }}>
        <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                    <Typography variant="subtitle2" sx={{ color: colors.textSecondary, fontWeight: 600 }}>
                        {title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mt: 1 }}>
                        {value}
                    </Typography>
                </Box>
                <Box sx={{ bgcolor: `${color}15`, p: 1.5, borderRadius: '12px', color: color }}>
                    {icon}
                </Box>
            </Stack>
            {subtext && (
                <Typography variant="caption" sx={{ color: colors.textSecondary, mt: 2, display: 'block' }}>
                    {subtext}
                </Typography>
            )}
        </CardContent>
    </Card>
);

export default function Dashboard() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estado para Métricas de Negócio
    const [stats, setStats] = useState({
        total: 0, emAndamento: 0, atrasados: 0, finalizados: 0, recentes: [], porSetor: { juridico: 0, gabinete: 0 }
    });

    // Estado para Saúde do Sistema
    const [systemHealth, setSystemHealth] = useState({
        database: { isUp: false },
        minio: { isUp: false }
    });

    const fetchAllData = () => {
        setLoading(true);
        Promise.all([fetchProcessos(), fetchHealth()])
            .finally(() => setLoading(false));
    };

    // 1. Busca Saúde do Sistema (Backend Java)
    const fetchHealth = async () => {
        try {
            // Certifique-se que seu Controller Java está mapeado para /api/health
            const response = await fetch('http://localhost:8080/api/health');
            if (response.ok) {
                const data = await response.json();
                setSystemHealth(data);
            } else {
                setSystemHealth({ database: { isUp: false }, minio: { isUp: false } });
            }
        } catch (e) {
            console.error("Erro no health check:", e);
            setSystemHealth({ database: { isUp: false }, minio: { isUp: false } });
        }
    };

    // 2. Busca Processos (Lógica original)
    const fetchProcessos = async () => {
        try {
            const response = await fetch('http://localhost:8080/processos');
            if (!response.ok) throw new Error('Falha ao buscar dados do servidor');
            const dadosReais = await response.json();
            calcularMetricas(dadosReais);
            setError(null);
        } catch (err) {
            console.error(err);
            setError("Não foi possível carregar os processos.");
        }
    };

    const calcularMetricas = (processos) => {
        const hoje = new Date().toISOString().split('T')[0];
        let contagem = { total: processos.length, emAndamento: 0, atrasados: 0, finalizados: 0, juridico: 0, gabinete: 0 };
        const ativos = processos.filter(p => p.status !== 'Finalizado' && p.status !== 'Cancelado');

        processos.forEach(p => {
            if (p.status === 'Finalizado') {
                contagem.finalizados++;
            } else if (p.status !== 'Cancelado') {
                contagem.emAndamento++;
                if (p.dataPrevisao && p.dataPrevisao < hoje) contagem.atrasados++;
            }
            if (p.setor === 'JURIDICO') contagem.juridico++;
            if (p.setor === 'GABINETE') contagem.gabinete++;
        });

        setStats({
            total: contagem.total,
            emAndamento: contagem.emAndamento,
            atrasados: contagem.atrasados,
            finalizados: contagem.finalizados,
            recentes: ativos.slice(0, 5),
            porSetor: { juridico: contagem.juridico, gabinete: contagem.gabinete }
        });
    };

    useEffect(() => {
        fetchAllData();
    }, []);

    const getStatusColor = (status) => {
        if (status === 'Finalizado') return 'success';
        if (status === 'Cancelado') return 'error';
        if (status?.includes('Juridico')) return 'info';
        return 'warning';
    };

    return (
        <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh', p: 3 }}>

            {/* NOVO: Widget de Saúde do Sistema no topo */}
            <SystemHealthWidget
                health={systemHealth}
                loading={loading}
                onRefresh={fetchAllData}
            />

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {loading && !stats.total ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>
            ) : (
                <>
                    {/* KPI CARDS */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard title="Total Processos" value={stats.total} icon={<AssignmentIcon />} color="#3b82f6" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard title="Em Andamento" value={stats.emAndamento} icon={<AccessTimeIcon />} color="#f59e0b" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard title="Atrasados" value={stats.atrasados} icon={<WarningAmberIcon />} color="#ef4444" subtext="Atenção Necessária" />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <StatCard title="Finalizados" value={stats.finalizados} icon={<CheckCircleOutlineIcon />} color="#10b981" />
                        </Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        {/* TABELA DE RECENTES */}
                        <Grid item xs={12} md={8}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: '#1e293b' }}>Pendências Prioritárias</Typography>
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Beneficiário</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Setor</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Previsão</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {stats.recentes.map((row) => (
                                                <TableRow key={row.id_processo} hover>
                                                    <TableCell>{row.nomeBeneficiado}</TableCell>
                                                    <TableCell>
                                                        <Chip label={row.status?.replace(/_/g, " ")} size="small" color={getStatusColor(row.status)} variant="outlined" />
                                                    </TableCell>
                                                    <TableCell>{row.setor}</TableCell>
                                                    <TableCell sx={{
                                                        color: row.dataPrevisao < new Date().toISOString().split('T')[0] ? colors.danger : 'inherit',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        {new Date(row.dataPrevisao).toLocaleDateString('pt-BR')}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {stats.recentes.length === 0 && (
                                                <TableRow><TableCell colSpan={4} align="center">Nenhuma pendência.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Grid>

                        {/* GRAFICO DE BARRAS (SETOR) */}
                        <Grid item xs={12} md={4}>
                            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%', border: '1px solid #e2e8f0' }}>
                                <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#1e293b' }}>Distribuição por Setor</Typography>

                                <Box sx={{ mb: 3 }}>
                                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                        <Typography variant="body2" fontWeight="600">Jurídico</Typography>
                                        <Typography variant="body2">{stats.porSetor.juridico}</Typography>
                                    </Stack>
                                    <LinearProgress variant="determinate"
                                                    value={stats.total > 0 ? (stats.porSetor.juridico / stats.total) * 100 : 0}
                                                    sx={{ height: 8, borderRadius: 5, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#3b82f6' } }}
                                    />
                                </Box>

                                <Box sx={{ mb: 3 }}>
                                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                                        <Typography variant="body2" fontWeight="600">Gabinete</Typography>
                                        <Typography variant="body2">{stats.porSetor.gabinete}</Typography>
                                    </Stack>
                                    <LinearProgress variant="determinate"
                                                    value={stats.total > 0 ? (stats.porSetor.gabinete / stats.total) * 100 : 0}
                                                    sx={{ height: 8, borderRadius: 5, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#f59e0b' } }}
                                    />
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </>
            )}
        </Box>
    );
}