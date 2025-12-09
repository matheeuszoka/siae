import * as React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuIcon from '@mui/icons-material/Menu';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

// Ícones
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import DescriptionIcon from '@mui/icons-material/Description'; // Ícone da Logo
import BackupOutlinedIcon from '@mui/icons-material/BackupOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
const drawerWidth = 200;

const colors = {
    sidebarBg: '#052e16',       // Verde Floresta Profundo
    sidebarText: '#a7f3d0',     // Verde Menta Claro
    activeBg: 'rgba(16, 185, 129, 0.1)', // Verde Esmeralda Transparente
    activeText: '#34d399',      // Verde Esmeralda Vibrante
    hoverBg: 'rgba(255, 255, 255, 0.03)',
    contentBg: '#f0fdf4',       // Fundo da página levemente esverdeado
};

function MainLayout(props) {
    const { window } = props;
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    // --- CONFIGURAÇÃO DO MENU ---
    const menuItems = [
        { text: 'Visão Geral', icon: <DashboardOutlinedIcon />, path: '/' },
        { text: 'Processo Digital', icon: <ArticleOutlinedIcon />, path: '/processos' },
        { text: 'Servidor Publico', icon: <PersonOutlinedIcon />, path: '/servidor' },
        { text: 'Backups', icon: <BackupOutlinedIcon />, path: '/backups' },
        { text: 'Certificado Digital', icon: <WorkspacePremiumOutlinedIcon />, path: '/certificados' },
    ];

    // --- LÓGICA DE BREADCRUMB E TÍTULO ---
    // Verifica se estamos em uma sub-rota de processos (ex: /processos/123)
    const isProcessoDetalhes = location.pathname.includes('/processos/') && location.pathname !== '/processos';

    const getPageTitle = () => {
        // Se for detalhe, retorna título específico
        if (isProcessoDetalhes) return 'Detalhes do Processo';

        // Se for página padrão, busca no menu
        const item = menuItems.find(i => i.path === location.pathname);
        return item ? item.text : 'SIAE';
    };

    const drawerContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

            {/* 1. LOGO */}
            <Box sx={{ height: 80, display: 'flex', alignItems: 'center', px: 3, gap: 1.5 }}>
                <DescriptionIcon sx={{ color: colors.activeText, fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', fontSize: '1rem' }}>
                    SIAE
                </Typography>
            </Box>

            {/* 2. MENU DE NAVEGAÇÃO */}
            <List sx={{ px: 1.5, flexGrow: 1 }}>
                {menuItems.map((item) => {
                    // Lógica para marcar ativo: é ativo se a URL for exata OU se for sub-rota (detalhes ativa processos)
                    const isActive = location.pathname === item.path || (item.path === '/processos' && isProcessoDetalhes);

                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                            <ListItemButton
                                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                                sx={{
                                    borderRadius: '8px',
                                    py: 1,
                                    color: isActive ? colors.activeText : '#6b7280',
                                    bgcolor: isActive ? colors.activeBg : 'transparent',
                                    '&:hover': { bgcolor: isActive ? colors.activeBg : colors.hoverBg, color: colors.activeText },
                                }}
                            >
                                <ListItemIcon sx={{ color: 'inherit', minWidth: '35px' }}>{item.icon}</ListItemIcon>
                                <ListItemText primary={item.text} primaryTypographyProps={{ fontSize: '0.815rem', fontWeight: isActive ? 600 : 400 }} />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            {/* 3. RODAPÉ DA SIDEBAR */}
            <Box sx={{ p: 2 }}>
                <Box sx={{ textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', pt: 2 }}>
                    <Typography
                        variant="caption"
                        sx={{
                            color: 'rgba(255, 255, 255, 0.3)',
                            fontSize: '0.65rem',
                            display: 'block',
                            lineHeight: 1.5
                        }}
                    >
                        Desenvolvido por
                        <Box component="span" sx={{ display: 'block', fontWeight: 600, color: colors.sidebarText }}>
                            MGC Tecnologia
                        </Box>
                    </Typography>
                </Box>
            </Box>
        </Box>
    );

    const container = window !== undefined ? () => window().document.body : undefined;

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />

            {/* AppBar Mobile */}
            <AppBar
                position="fixed"
                elevation={0}
                sx={{
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    ml: { sm: `${drawerWidth}px` },
                    display: { sm: 'none' },
                    bgcolor: colors.sidebarBg,
                }}
            >
                <Toolbar>
                    <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
                        <MenuIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* NAV DRAWER */}
            <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
                <Drawer
                    container={container}
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: colors.sidebarBg, border: 'none' } }}
                >
                    {drawerContent}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: colors.sidebarBg, borderRight: 'none' } }}
                    open
                >
                    {drawerContent}
                </Drawer>
            </Box>

            {/* --- ÁREA PRINCIPAL --- */}
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { sm: `calc(100% - ${drawerWidth}px)` },
                    minHeight: '100vh',
                    bgcolor: colors.contentBg,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <Toolbar sx={{ display: { sm: 'none' } }} />

                {/* HEADER INTERNO */}
                <Box sx={{ px: 4, pt: 4, pb: 2 }}>

                    {/* --- BREADCRUMBS ATUALIZADO --- */}
                    <Breadcrumbs
                        separator={<NavigateNextIcon fontSize="small" />}
                        aria-label="breadcrumb"
                        sx={{ mb: 0.5, '& .MuiTypography-root': { fontSize: '0.8rem'} }}
                    >
                        {/* 1. Nível Raiz */}
                        <Link underline="hover" color="inherit" href="/" sx={{ display: 'flex', alignItems: 'center' }}>
                            SIAE
                        </Link>

                        {/* 2. Lógica Dinâmica */}
                        {isProcessoDetalhes ? (
                            // Caso: Detalhes (Mostra link para voltar e texto "Detalhes")
                            [
                                <Link underline="hover" color="inherit" href="/processos" key="crumb-processos">
                                    Processo Digital
                                </Link>,
                                <Typography color="text.primary" key="crumb-detalhes">
                                    Detalhes
                                </Typography>
                            ]
                        ) : (
                            // Caso: Páginas Padrão (Mostra apenas o título atual)
                            <Typography color="text.primary">{getPageTitle()}</Typography>
                        )}
                    </Breadcrumbs>

                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                        {getPageTitle()}
                    </Typography>
                </Box>

                {/* CONTEÚDO */}
                <Box sx={{ px: 4, pb: 4, flexGrow: 1 }}>
                    <Outlet />
                </Box>

            </Box>
        </Box>
    );
}

export default MainLayout;