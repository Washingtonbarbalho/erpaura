document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.nav-link');
    const iframe = document.getElementById('content-frame');

    // Mapeamento atualizado: 
    // Mapeia o ID do link para o arquivo HTML e o HASH da aba
    const pages = {
        'nav-vendas': { file: 'vendas.html', hash: '#vendas' },
        'nav-clientes': { file: 'vendas.html', hash: '#clientes' },
        'nav-produtos': { file: 'vendas.html', hash: '#produtos' },
        'nav-carne-novo': { file: 'carne.html', hash: '#novo' },
        'nav-carne-gerenciar': { file: 'carne.html', hash: '#gerenciar' },
        'nav-analise': { file: 'analise.html', hash: '' },
        'nav-estoque': { file: 'admin.html', hash: '#estoque' },
        'nav-financeiro': { file: 'admin.html', hash: '#financeiro' },
        'nav-relatorio': { file: 'admin.html', hash: '#relatorios' },
    };

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove a classe ativa de todos os links
            links.forEach(l => l.classList.remove('nav-active'));

            // Adiciona a classe ativa ao link clicado
            link.classList.add('nav-active');

            // Obtém as informações da página (arquivo e hash)
            const pageInfo = pages[link.id];
            
            if (pageInfo) {
                const newSrc = pageInfo.file + pageInfo.hash;
                
                // Altera o 'src' do iframe para carregar a nova página/aba
                // Verificamos se o src é diferente para evitar recargas desnecessárias
                // (embora mudar o hash vá recarregar de qualquer forma, é uma boa prática)
                const currentSrc = iframe.src.split('/').pop(); // ex: "vendas.html#clientes"
                if (currentSrc !== newSrc) {
                     iframe.src = newSrc;
                }
            }
        });
    });

    // Garante que o link 'vendas' esteja ativo no carregamento inicial
    document.getElementById('nav-vendas').classList.add('nav-active');
    // Carrega a página inicial (vendas.html)
    iframe.src = pages['nav-vendas'].file + pages['nav-vendas'].hash;
});
