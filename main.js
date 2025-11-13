document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.nav-link');
    const iframe = document.getElementById('content-frame');

    // Mapeamento ATUALIZADO para a nova estrutura de pastas
    const pages = {
        'nav-vendas': { file: 'modules/vendas/vendas.html', hash: '#vendas' },
        'nav-clientes': { file: 'modules/vendas/vendas.html', hash: '#clientes' },
        'nav-produtos': { file: 'modules/vendas/vendas.html', hash: '#produtos' },
        
        // Você precisará refatorar os outros módulos e atualizar os caminhos aqui
        'nav-carne-novo': { file: 'modules/carne/carne.html', hash: '#novo' },
        'nav-carne-gerenciar': { file: 'modules/carne/carne.html', hash: '#gerenciar' },
        'nav-analise': { file: 'modules/analise/analise.html', hash: '' },
        'nav-estoque': { file: 'modules/admin/admin.html', hash: '#estoque' },
        'nav-financeiro': { file: 'modules/admin/admin.html', hash: '#financeiro' },
        'nav-relatorio': { file: 'modules/admin/admin.html', hash: '#relatorios' },
    };

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            links.forEach(l => l.classList.remove('nav-active'));
            link.classList.add('nav-active');

            const pageInfo = pages[link.id];
            
            if (pageInfo) {
                const newSrc = pageInfo.file + pageInfo.hash;
                
                // Extrai o src atual do iframe
                const currentPath = iframe.src.replace(window.location.origin, '');
                
                // Compara o caminho relativo + hash
                if (currentPath.split('#')[0] !== pageInfo.file || currentPath.split('#')[1] !== (pageInfo.hash || '').substring(1)) {
                    iframe.src = newSrc;
                }
            }
        });
    });

    // Garante que o link 'vendas' esteja ativo no carregamento inicial
    const initialLink = document.getElementById('nav-vendas');
    if (initialLink) {
        initialLink.classList.add('nav-active');
        const initialPage = pages[initialLink.id];
        iframe.src = initialPage.file + initialPage.hash;
    }
});
