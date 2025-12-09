import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    TextField,
    InputAdornment,
    IconButton,
    Tooltip,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    CircularProgress,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Fade,
    Dialog,
    DialogTitle,
    DialogContent,
    Stack,
    DialogActions,
    Snackbar,
    Alert,
    Divider
} from '@mui/material';

// --- ÍCONES ---
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import MoreVertIcon from '@mui/icons-material/MoreVert'; // Ícone de menu (três pontinhos)
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete'; // Ícone para excluir (visual)

// --- CONFIGURAÇÃO VISUAL (Mesma do ProcessosPage) ---
const colors = {
    primary: '#059669', // Emerald 600
    secondary: '#10b981', // Emerald 500
    bgHover: '#f0fdf4',
    textSecondary: '#64748b'
};

export default function ServidoresPage() {
    // 1. ESTADOS GERAIS
    const [servidores, setServidores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingSave, setLoadingSave] = useState(false);
    const [filterTerm, setFilterTerm] = useState('');

    // 2. ESTADOS DO MENU DE CONTEXTO
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedServidor, setSelectedServidor] = useState(null);
    const openMenu = Boolean(anchorEl);

    // 3. ESTADOS DO MODAL (Criação e Edição)
    const [openModal, setOpenModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // Define se é Novo ou Edição
    const [formData, setFormData] = useState({
        id_servidor: null,
        nomeCompleto: '',
        telefone: ''
    });

    // 4. ESTADO DO SNACKBAR
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // --- HELPER: MÁSCARA DE TELEFONE ---
    const formatTelefone = (value) => {
        if (!value) return "";
        const cleanValue = value.replace(/\D/g, '');
        const limitedValue = cleanValue.substring(0, 11);
        if (limitedValue.length <= 10) {
            return limitedValue.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            return limitedValue.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
        }
    };

    // --- HELPER: SNACKBAR ---
    const showSnackbar = (message, severity = 'success') => {
        setSnackbar({ open: true, message, severity });
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    // --- BUSCAR DADOS (GET) ---
    useEffect(() => {
        fetchServidores();
    }, []);

    const fetchServidores = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:8080/servidor-publico');
            setServidores(response.data);
        } catch (error) {
            console.error("Erro ao buscar servidores:", error);
            showSnackbar('Erro ao carregar lista de servidores.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- LÓGICA DE FILTRO (Frontend) ---
    const filteredServidores = servidores.filter((serv) => {
        const term = filterTerm.toLowerCase();
        return (
            serv.nomeCompleto?.toLowerCase().includes(term) ||
            serv.telefone?.includes(term) ||
            serv.id_servidor?.toString().includes(term)
        );
    });

    const clearFilters = () => setFilterTerm('');

    // --- MANIPULAÇÃO DO FORMULÁRIO ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;

        if (name === 'telefone') {
            finalValue = formatTelefone(value);
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const isFormValid = () => {
        return (
            formData.nomeCompleto?.trim().length >= 3 &&
            formData.telefone?.trim().length >= 10 // (xx) xxxx-xxxx
        );
    };

    const handleOpenModal = (servidor = null) => {
        if (servidor) {
            // Modo Edição
            setIsEditing(true);
            setFormData({
                id_servidor: servidor.id_servidor,
                nomeCompleto: servidor.nomeCompleto,
                telefone: servidor.telefone
            });
        } else {
            // Modo Criação
            setIsEditing(false);
            setFormData({ id_servidor: null, nomeCompleto: '', telefone: '' });
        }
        setOpenModal(true);
        handleCloseMenu(); // Fecha o menu se estiver aberto
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setFormData({ id_servidor: null, nomeCompleto: '', telefone: '' });
    };

    // --- SALVAR (POST ou PUT) ---
    const handleSave = async () => {
        if (!isFormValid()) {
            showSnackbar('Preencha os campos corretamente.', 'warning');
            return;
        }

        setLoadingSave(true);
        try {
            if (isEditing) {
                // PUT: Atualizar
                await axios.put(`http://localhost:8080/servidor-publico/${formData.id_servidor}`, formData);
                showSnackbar('Servidor atualizado com sucesso!', 'success');
            } else {
                // POST: Criar
                await axios.post('http://localhost:8080/servidor-publico', formData);
                showSnackbar('Servidor cadastrado com sucesso!', 'success');
            }

            fetchServidores(); // Recarrega a lista
            handleCloseModal();

        } catch (error) {
            console.error("Erro ao salvar:", error);
            const msg = error.response?.data?.message || "Erro ao salvar servidor.";
            showSnackbar(msg, 'error');
        } finally {
            setLoadingSave(false);
        }
    };

    // --- MENU DE CONTEXTO ---
    const handleRowClick = (event, servidor) => {
        setAnchorEl(event.currentTarget);
        setSelectedServidor(servidor);
    };

    const handleCloseMenu = () => {
        setAnchorEl(null);
        setSelectedServidor(null);
    };

    return (
        <Box sx={{ p: 4 }}>

            {/* 1. CABEÇALHO */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                    Gestão de Servidores
                </Typography>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenModal()}
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
                    Novo Servidor
                </Button>
            </Box>

            {/* 2. BARRA DE FILTRO */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={5}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Buscar por nome ou telefone..."
                            value={filterTerm}
                            onChange={(e) => setFilterTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: '#94a3b8' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>

                    <Grid item xs={12} md={7} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        {filterTerm && (
                            <Button startIcon={<ClearIcon />} onClick={clearFilters} sx={{ color: '#64748b' }}>
                                Limpar Busca
                            </Button>
                        )}
                    </Grid>
                </Grid>
            </Paper>

            {/* 3. TABELA */}
            <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold', color: '#475569', width: '10%' }}># ID</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#475569', width: '50%' }}>Nome Completo</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#475569', width: '30%' }}>Telefone</TableCell>
                            <TableCell sx={{ fontWeight: 'bold', color: '#475569', width: '10%', textAlign: 'right' }}>Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                                    <CircularProgress sx={{ color: colors.primary }} />
                                </TableCell>
                            </TableRow>
                        ) : filteredServidores.length > 0 ? (
                            filteredServidores.map((row) => (
                                <TableRow
                                    key={row.id_servidor}
                                    sx={{
                                        transition: 'background-color 0.2s',
                                        '&:hover': { bgcolor: colors.bgHover }
                                    }}
                                >
                                    <TableCell>{row.id_servidor}</TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{row.nomeCompleto}</TableCell>
                                    <TableCell>{row.telefone}</TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" onClick={(e) => handleRowClick(e, row)}>
                                            <MoreVertIcon sx={{ color: '#94a3b8' }} />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#94a3b8' }}>
                                    Nenhum servidor encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* 4. MENU DE AÇÕES */}
            <Menu
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleCloseMenu}
                TransitionComponent={Fade}
                PaperProps={{ sx: { minWidth: 160, borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } }}
            >
                <MenuItem onClick={() => handleOpenModal(selectedServidor)} sx={{ py: 1.5 }}>
                    <ListItemIcon><EditIcon fontSize="small" sx={{ color: colors.primary }} /></ListItemIcon>
                    <ListItemText>Editar</ListItemText>
                </MenuItem>

                {/* Nota: Backend não tem endpoint de Delete, botão apenas visual por enquanto */}
                <MenuItem disabled sx={{ py: 1.5, color: '#ef4444' }}>
                    <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: '#ef4444' }} /></ListItemIcon>
                    <ListItemText>Excluir (Indisp.)</ListItemText>
                </MenuItem>
            </Menu>

            {/* 5. MODAL DE FORMULÁRIO */}
            <Dialog
                open={openModal}
                onClose={handleCloseModal}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: '20px', boxShadow: '0px 10px 40px rgba(0,0,0,0.1)' } }}
            >
                <DialogTitle
                    sx={{
                        bgcolor: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        py: 2.5, px: 3,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ bgcolor: colors.bgHover, p: 1, borderRadius: '8px', color: colors.primary }}>
                            <PersonIcon />
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                            {isEditing ? 'Editar Servidor' : 'Novo Servidor'}
                        </Typography>
                    </Box>
                    <IconButton onClick={handleCloseModal} size="small" disabled={loadingSave}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 4 }}>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            autoFocus
                            label="Nome Completo"
                            name="nomeCompleto"
                            fullWidth
                            required
                            placeholder="Ex: João da Silva"
                            value={formData.nomeCompleto}
                            onChange={handleInputChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonIcon sx={{ color: '#94a3b8' }} />
                                    </InputAdornment>
                                )
                            }}
                        />

                        <TextField
                            label="Telefone"
                            name="telefone"
                            fullWidth
                            required
                            placeholder="(xx) 9xxxx-xxxx"
                            value={formData.telefone}
                            onChange={handleInputChange}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PhoneIcon sx={{ color: '#94a3b8' }} />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Stack>
                </DialogContent>

                <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', gap: 1 }}>
                    <Button onClick={handleCloseModal} disabled={loadingSave} sx={{ color: '#64748b', fontWeight: 600 }}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleSave}
                        disabled={loadingSave}
                        startIcon={loadingSave ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        sx={{
                            bgcolor: colors.primary,
                            fontWeight: 'bold',
                            px: 4, py: 1, borderRadius: '8px',
                            '&:hover': { bgcolor: colors.secondary }
                        }}
                    >
                        {loadingSave ? 'Salvando...' : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 6. SNACKBAR DE NOTIFICAÇÃO */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%', boxShadow: 3, fontWeight: 'bold' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

        </Box>
    );
}