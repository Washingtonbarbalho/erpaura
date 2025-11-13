document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.nav-link');
    const iframe = document.getElementById('content-frame');

    // Mapeia o ID do link para o arquivo HTML correspondente
    const pages = {
        'nav-vendas': 'vendas.html',
        'nav-carne': 'carne.html',
        'nav-analise': 'analise.html',
        'nav-admin': 'admin.html'
    };

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Remove a classe ativa de todos os links
            links.forEach(l => l.classList.remove('nav-active'));

            // Adiciona a classe ativa ao link clicado
            link.classList.add('nav-active');

            // Obtém o nome da página alvo
            const pageFile = pages[link.id];
            
            // Altera o 'src' do iframe para carregar a nova página
            if (pageFile && iframe.src.endsWith(pageFile) === false) {
                iframe.src = pageFile;
            }
        });
    });

    // Garante que o link 'vendas' esteja ativo no carregamento inicial
    document.getElementById('nav-vendas').classList.add('nav-active');
    // Carrega a página inicial (vendas.html)
    iframe.src = 'vendas.html';
});
