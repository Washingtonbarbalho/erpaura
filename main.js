document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.nav-link');
    const iframe = document.getElementById('content-frame');
    const loader = document.getElementById('content-frame-loader');

    // Mapeamento simplificado para os 4 botões
    const pages = {
        'nav-vendas': 'vendas.html',
        'nav-carne': 'carne.html',
        'nav-analise': 'analise.html',
        'nav-admin': 'admin.html',
    };

    // Listener para esconder o loader quando o iframe terminar de carregar
    iframe.addEventListener('load', () => {
        loader.classList.add('hidden');
    });

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // 1. Atualiza o estado ativo do menu
            links.forEach(l => l.classList.remove('nav-active'));
            link.classList.add('nav-active');

            // 2. Pega o arquivo de destino
            const newFile = pages[link.id];
            if (!newFile) return; // Se o link não for mapeado

            // 3. Pega o arquivo atual
            const currentFile = iframe.src.split('/').pop().split('#')[0];

            // 4. Compara
            if (currentFile !== newFile) {
                // Se for um arquivo diferente, mostra o loader e carrega
                loader.classList.remove('hidden');
                iframe.src = newFile;
            } else {
                // Se for o mesmo arquivo, apenas recarrega (sem loader, pois é rápido)
                // Isso garante que o usuário volte para a aba padrão
                iframe.src = newFile;
            }
        });
    });

    // Configuração inicial
    const initialLink = document.getElementById('nav-vendas');
    if (initialLink) {
        initialLink.classList.add('nav-active');
        // Mostra o loader no carregamento inicial
        loader.classList.remove('hidden');
        iframe.src = pages[initialLink.id];
    }
});
