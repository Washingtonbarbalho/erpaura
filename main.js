document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.nav-link');
    const iframe = document.getElementById('content-frame');
    const loader = document.getElementById('content-frame-loader');
    
    // Elementos Mobile
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    // --- 1. PWA: Registro do Service Worker ---
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('ServiceWorker registrado com sucesso: ', registration.scope);
                }, err => {
                    console.log('Falha no registro do ServiceWorker: ', err);
                });
        });
    }

    // --- 2. Lógica do Menu Mobile ---
    function toggleSidebar() {
        const isClosed = sidebar.classList.contains('-translate-x-full');
        if (isClosed) {
            // Abrir
            sidebar.classList.remove('-translate-x-full');
            overlay.classList.remove('hidden');
        } else {
            // Fechar
            sidebar.classList.add('-translate-x-full');
            overlay.classList.add('hidden');
        }
    }

    if (mobileBtn) {
        mobileBtn.addEventListener('click', toggleSidebar);
    }
    if (overlay) {
        overlay.addEventListener('click', toggleSidebar);
    }

    // --- 3. Navegação e Iframe ---
    const pages = {
        'nav-vendas': 'vendas.html',
        'nav-carne': 'carne.html',
        'nav-analise': 'analise.html',
        'nav-admin': 'admin.html',
    };

    iframe.addEventListener('load', () => {
        loader.classList.add('hidden');
    });

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            links.forEach(l => l.classList.remove('nav-active'));
            link.classList.add('nav-active');

            const newFile = pages[link.id];
            if (!newFile) return;

            // Se estiver no mobile, fecha o menu ao clicar
            if (window.innerWidth < 768) {
                toggleSidebar();
            }

            const currentFile = iframe.src.split('/').pop().split('#')[0];

            if (currentFile !== newFile) {
                loader.classList.remove('hidden');
                iframe.src = newFile;
            } else {
                iframe.src = newFile;
            }
        });
    });

    // Configuração inicial
    const initialLink = document.getElementById('nav-vendas');
    if (initialLink) {
        initialLink.classList.add('nav-active');
        loader.classList.remove('hidden');
        iframe.src = pages[initialLink.id];
    }
});
