import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './componentes/MainLayout';

// 1. Importe a página que criamos
import ProcessosPage from './componentes/processos';
import ProcessoDetalhes from './componentes/ProcessoDetalhes';
import ServidorPublico from './componentes/ServidorPublico';

import Dashboard from './componentes/Dashboard'

import Backups from './componentes/BackupManager'
import Certificado from './componentes/CertificadoManager'

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Rota Pai (Layout com Sidebar) */}
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<Dashboard />} />
                    {/* 2. Defina a rota "processos" para renderizar a ProcessosPage */}
                    <Route path="processos" element={<ProcessosPage />} />
                    <Route path="processos/detalhes/:id" element={<ProcessoDetalhes />} />
                    <Route path="servidor" element={<ServidorPublico />} />

                    <Route path="backups" element={<Backups />} />
                    <Route path="certificados" element={<Certificado />} />


                    {/* Sugestão: Crie uma rota index (dashboard) para não ficar em branco ao abrir o site */}
                    <Route index element={<h1>Bem-vindo ao SIAE (Dashboard)</h1>} />

                </Route>

            </Routes>
        </BrowserRouter>
    );
}

export default App;