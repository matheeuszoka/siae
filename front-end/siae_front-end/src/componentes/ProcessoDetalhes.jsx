import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format, parseISO, addDays } from 'date-fns';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    Chip,
    TextField,
    IconButton,
    Divider,
    Stack,
    Card,
    CardActionArea,
    CircularProgress,
    MenuItem,
    InputAdornment
} from '@mui/material';

// --- ÍCONES ---
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; // Novo ícone
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone'; // Novo ícone
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import TimerIcon from '@mui/icons-material/Timer';
import SubjectIcon from '@mui/icons-material/Subject';

const colors = {
    primary: '#059669',
    secondary: '#10b981',
    bgHover: '#f0fdf4',
    bgCard: '#ffffff',
    textSecondary: '#64748b'
};

export default function ProcessoDetalhes() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Estados de Dados
    const [processo, setProcesso] = useState(null);
    const [formData, setFormData] = useState({});

    // Estado para arquivos NOVOS selecionados na edição
    const [selectedFiles, setSelectedFiles] = useState({});

    // Estados de UI
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    // --- CARREGAR DADOS ---
    useEffect(() => {
        fetchDetalhes();
    }, [id]);

    const fetchDetalhes = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/processos/${id}`);
            setProcesso(response.data);
            setFormData(response.data);
            setSelectedFiles({}); // Reseta arquivos selecionados
        } catch (error) {
            console.error("Erro ao buscar detalhes:", error);
            alert("Erro ao carregar o processo.");
        } finally {
            setLoading(false);
        }
    };

    // --- MANIPULADORES DE TEXTO ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = { ...prev, [name]: value };

            // Recalcula previsão automaticamente
            if ((name === 'estimativa' || name === 'dataAbertura') && newData.dataAbertura && newData.estimativa) {
                try {
                    const dtAbertura = parseISO(newData.dataAbertura);
                    const dtPrevisao = addDays(dtAbertura, parseInt(newData.estimativa));
                    newData.dataPrevisao = format(dtPrevisao, 'yyyy-MM-dd');
                } catch (err) { console.error(err); }
            }
            return newData;
        });
    };

    // --- MANIPULADOR DE ARQUIVOS (NOVO) ---
    const handleFileSelect = (event, keyName) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setSelectedFiles(prev => ({
                ...prev,
                [keyName]: file
            }));
        }
    };

    // --- SALVAR (PUT) ---
    const handleSave = async () => {
        setSaving(true);
        try {
            const dataToSend = new FormData();

            // 1. Campos de Texto Simples
            dataToSend.append('assunto', formData.assunto || '');
            dataToSend.append('setor', formData.setor || '');
            dataToSend.append('dataAbertura', formData.dataAbertura || '');
            dataToSend.append('estimativa', formData.estimativa || 0);

            // 2. Campos Obrigatórios do Servidor (Correção do Erro Java)
            dataToSend.append('servidorPublico.nomeCompleto', formData.nomeBeneficiado || '');
            // Se o telefone estiver vazio na edição, tenta usar o original ou um placeholder para não quebrar
            dataToSend.append('servidorPublico.telefone', formData.telefone || '00000000000');

            // 3. Arquivos (Apenas se foram alterados/selecionados)
            if (selectedFiles.reqPessoa) dataToSend.append('reqPessoa', selectedFiles.reqPessoa);
            if (selectedFiles.memSolicitacaoJur) dataToSend.append('memSolicitacaoJur', selectedFiles.memSolicitacaoJur);
            if (selectedFiles.parecerJuridico) dataToSend.append('parecerJuridico', selectedFiles.parecerJuridico); // Caso queira permitir atualizar parecer
            if (selectedFiles.memorandoPref) dataToSend.append('memorandoPref', selectedFiles.memorandoPref);
            if (selectedFiles.decisaoPrefeito) dataToSend.append('decisaoPrefeito', selectedFiles.decisaoPrefeito);

            // 4. Envio PUT Multipart
            const response = await axios.put(`http://localhost:8080/processos/${id}`, dataToSend, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            // 5. Sucesso
            setProcesso(response.data);
            setFormData(response.data);
            setSelectedFiles({});
            setIsEditing(false);
            alert("Processo atualizado com sucesso!");

        } catch (error) {
            console.error("Erro ao salvar:", error);
            const msg = error.response?.data?.message || "Erro ao salvar alterações.";
            alert(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setFormData(processo);
        setSelectedFiles({});
        setIsEditing(false);
    };

    const getStatusColor = (status) => {
        if (!status) return 'default';
        if (status.includes('Finalizado') || status.includes('Deferido')) return 'success';
        if (status.includes('Cancelado')) return 'error';
        return 'warning';
    };

    // --- COMPONENTE DE CARD DE DOCUMENTO INTELIGENTE ---
    // Aceita visualização (link) e edição (input file)
    const DocumentCard = ({ label, url, fileKey }) => {
        const hasUrl = !!url;
        const newFile = selectedFiles[fileKey]; // Verifica se tem um arquivo novo selecionado

        // Se estiver editando, mostra interface de Upload
        if (isEditing) {
            return (
                <Card variant="outlined" sx={{ borderStyle: 'dashed', borderColor: newFile ? colors.primary : '#cbd5e1', bgcolor: newFile ? '#f0fdf4' : '#fff' }}>
                    <Button
                        component="label"
                        fullWidth
                        sx={{
                            p: 2,
                            justifyContent: 'flex-start',
                            textTransform: 'none',
                            height: '100%',
                            color: newFile ? colors.primary : '#64748b'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                            <Box sx={{ p: 1, borderRadius: '8px', bgcolor: newFile ? '#d1fae5' : '#f1f5f9' }}>
                                {newFile ? <PictureAsPdfIcon /> : <CloudUploadIcon />}
                            </Box>
                            <Box sx={{ textAlign: 'left', overflow: 'hidden' }}>
                                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 'bold' }}>{label}</Typography>
                                <Typography variant="caption" noWrap display="block">
                                    {newFile ? `Novo: ${newFile.name}` : (hasUrl ? "Substituir arquivo atual" : "Anexar arquivo")}
                                </Typography>
                            </Box>
                        </Box>
                        <input
                            type="file"
                            hidden
                            accept="application/pdf,image/*"
                            onChange={(e) => handleFileSelect(e, fileKey)}
                        />
                    </Button>
                </Card>
            );
        }

        // Modo Visualização (Read-Only)
        return (
            <Card variant="outlined" sx={{
                borderColor: hasUrl ? colors.primary : '#e2e8f0',
                bgcolor: hasUrl ? '#f0fdf4' : '#f8fafc',
                transition: 'transform 0.2s',
                '&:hover': { transform: hasUrl ? 'translateY(-3px)' : 'none' }
            }}>
                <CardActionArea disabled={!hasUrl} onClick={() => hasUrl && window.open(url, '_blank')} sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1, borderRadius: '8px', bgcolor: hasUrl ? 'white' : '#cbd5e1', color: hasUrl ? '#ef4444' : '#64748b' }}>
                            {hasUrl ? <PictureAsPdfIcon /> : <DescriptionIcon />}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#334155' }}>{label}</Typography>
                            <Typography variant="caption" sx={{ color: colors.textSecondary }}>{hasUrl ? 'Clique para ver' : 'Vazio'}</Typography>
                        </Box>
                        {hasUrl && <CloudDownloadIcon sx={{ color: colors.primary }} />}
                    </Box>
                </CardActionArea>
            </Card>
        );
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

    return (
        <Box sx={{ maxWidth: '1200px', margin: '0 auto', p: 2 }}>

            {/* CABEÇALHO */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => navigate('/processos')} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}><ArrowBackIcon /></IconButton>
                    <Box>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Processo #{processo?.id_processo}</Typography>
                        <Chip label={processo?.status?.replace(/_/g, ' ')} color={getStatusColor(processo?.status)} size="small" sx={{ fontWeight: 'bold', mt: 0.5 }} />
                    </Box>
                </Box>
                <Box>
                    {isEditing ? (
                        <Stack direction="row" spacing={1}>
                            <Button variant="outlined" color="error" startIcon={<CancelIcon />} onClick={handleCancelEdit}>Cancelar</Button>
                            <Button variant="contained" startIcon={saving ? <CircularProgress size={20} color="inherit"/> : <SaveIcon />} onClick={handleSave} disabled={saving} sx={{ bgcolor: colors.primary }}>Salvar</Button>
                        </Stack>
                    ) : (
                        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setIsEditing(true)} sx={{ color: colors.primary, borderColor: colors.primary }}>Editar</Button>
                    )}
                </Box>
            </Box>

            <Grid container spacing={3}>

                {/* COLUNA ESQUERDA - DADOS GERAIS */}
                <Grid item xs={12} md={8}>
                    <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, display: 'flex', gap: 1 }}>
                            <DescriptionIcon sx={{ color: colors.primary }} /> Dados Gerais
                        </Typography>

                        <Grid container spacing={3}>

                            {/* Assunto (Novo) */}
                            <Grid item xs={12}>
                                {isEditing ? (
                                    <TextField
                                        fullWidth label="Assunto do Processo" name="assunto"
                                        value={formData.assunto || ''} onChange={handleInputChange}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><SubjectIcon /></InputAdornment> }}
                                    />
                                ) : (
                                    <Box>
                                        <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 'bold' }}>ASSUNTO</Typography>
                                        <Typography variant="h6" sx={{ color: '#1e293b' }}>{processo.assunto || 'Sem assunto'}</Typography>
                                    </Box>
                                )}
                            </Grid>

                            <Grid item xs={12}><Divider /></Grid>

                            {/* Nome Beneficiado */}
                            <Grid item xs={12} sm={8}>
                                {isEditing ? (
                                    <TextField
                                        fullWidth label="Nome Beneficiado" name="nomeBeneficiado"
                                        value={formData.nomeBeneficiado || ''} onChange={handleInputChange}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon /></InputAdornment> }}
                                    />
                                ) : (
                                    <Box>
                                        <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 'bold' }}>BENEFICIADO</Typography>
                                        <Typography variant="body1">{processo.nomeBeneficiado}</Typography>
                                    </Box>
                                )}
                            </Grid>

                            {/* Telefone (Obrigatório para o Backend) */}
                            <Grid item xs={12} sm={4}>
                                {isEditing ? (
                                    <TextField
                                        fullWidth label="Telefone" name="telefone"
                                        value={formData.telefone || ''} onChange={handleInputChange}
                                        placeholder="(xx) 9xxxx-xxxx"
                                        InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon /></InputAdornment> }}
                                    />
                                ) : (
                                    <Box>
                                        <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 'bold' }}>TELEFONE</Typography>
                                        <Typography variant="body1">{processo.telefone || '-'}</Typography>
                                    </Box>
                                )}
                            </Grid>

                            {/* Setor e Datas */}
                            <Grid item xs={12} sm={6}>
                                {isEditing ? (
                                    <TextField select fullWidth label="Setor Destino" name="setor" value={formData.setor || ''} onChange={handleInputChange}>
                                        <MenuItem value="JURIDICO">Jurídico</MenuItem>
                                        <MenuItem value="GABINETE">Gabinete</MenuItem>
                                    </TextField>
                                ) : (
                                    <Box>
                                        <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 'bold' }}>SETOR ATUAL</Typography>
                                        <Stack direction="row" alignItems="center" gap={1}>
                                            <FolderOpenIcon fontSize="small" sx={{ color: colors.primary }} />
                                            <Typography variant="body1">{processo.setor}</Typography>
                                        </Stack>
                                    </Box>
                                )}
                            </Grid>

                            <Grid item xs={12} sm={6}>
                                {isEditing ? (
                                    <TextField fullWidth type="date" label="Data Abertura" name="dataAbertura" value={formData.dataAbertura || ''} onChange={handleInputChange} />
                                ) : (
                                    <Box>
                                        <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 'bold' }}>DATA ABERTURA</Typography>
                                        <Stack direction="row" alignItems="center" gap={1}>
                                            <EventIcon fontSize="small" sx={{ color: colors.primary }} />
                                            <Typography variant="body1">{processo.dataAbertura ? format(parseISO(processo.dataAbertura), 'dd/MM/yyyy') : '-'}</Typography>
                                        </Stack>
                                    </Box>
                                )}
                            </Grid>

                            {/* Estimativas */}
                            <Grid item xs={6}>
                                {isEditing ? (
                                    <TextField fullWidth type="number" label="Estimativa (dias)" name="estimativa" value={formData.estimativa || ''} onChange={handleInputChange} />
                                ) : (
                                    <Box>
                                        <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 'bold' }}>ESTIMATIVA</Typography>
                                        <Typography variant="body1">{processo.estimativa} dias</Typography>
                                    </Box>
                                )}
                            </Grid>

                            <Grid item xs={6}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 'bold' }}>PREVISÃO</Typography>
                                    <Typography variant="body1" sx={{ color: colors.primary, fontWeight: 'bold' }}>
                                        {formData.dataPrevisao ? format(parseISO(formData.dataPrevisao), 'dd/MM/yyyy') : '-'}
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* COLUNA DIREITA - DOCUMENTOS */}
                <Grid item xs={12} md={4}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#334155' }}>
                        Documentação
                    </Typography>

                    <Grid container spacing={2}>

                        {/* Linha 1 */}
                        <Grid item xs={12} sm={6}>
                            <DocumentCard
                                label="Requerimento Pessoal"
                                url={processo?.docsAnexados?.reqPessoaUrl}
                                fileKey="reqPessoa" // <--- NECESSÁRIO PARA O UPLOAD FUNCIONAR
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <DocumentCard
                                label="Memorando Solicitação Jurídica"
                                url={processo?.docsAnexados?.memSolicitacaoJurUrl}
                                fileKey="memSolicitacaoJur" // <--- AQUI
                            />
                        </Grid>

                        {/* Linha 2 - Parecer e Memorando do Prefeito lado a lado */}
                        <Grid item xs={12} sm={6}>
                            <DocumentCard
                                label="Parecer Jurídico"
                                url={processo?.docsAnexados?.parecerJuridicoUrl}
                                fileKey="parecerJuridico" // <--- AQUI
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            {/* --- NOVO ITEM --- */}
                            <DocumentCard
                                label="Memorando Prefeito"
                                url={processo?.docsAnexados?.memorandoPrefUrl}
                                fileKey="memorandoPref" // <--- AQUI
                            />
                        </Grid>

                        {/* Linha 3 */}
                        <Grid item xs={12} sm={6}>
                            <DocumentCard
                                label="Decisão do Prefeito"
                                url={processo?.docsAnexados?.decisaoPrefUrl}
                                fileKey="decisaoPrefeito" // <--- AQUI
                            />
                        </Grid>

                        {/* Botão de Edição (se necessário) */}


                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
}