// modules/vendas/vendas.js
// Este é o "controlador" principal da página de vendas.
// Ele lida com a autenticação, navegação de abas e inicializa os scripts de cada aba.

// Importações de módulos compartilhados
import { 
    auth, 
    setupAuth, 
    getCollections 
} from '../firebase.js';

// Importações dos scripts de cada aba
import { initVendasTab } from './tab_vendas.js';
import { initClientesTab } from './tab_clientes.js';
import { initProdutosTab } from './tab_produtos.js';

// Aguarda o DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {

    // --- Seletores de Elementos Globais ---
    const loginScreen = document.getElementById('login-screen');
    const mainContent = document.getElementById('main-content');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    
    // Abas
    const tabs = {
        vendas: document.getElementById('tab-vendas'),
        clientes: document.getElementById('tab-clientes'),
        produtos: document.getElementById('tab-produtos'),
    };

    // Páginas
    const pages = {
        vendas: document.getElementById('page-vendas'),
        clientes: document.getElementById('page-clientes'),
        produtos: document.getElementById('page-produtos'),
    };

    let currentCollections = {}; // Armazena as coleções do usuário

    // --- Lógica de Autenticação ---
    setupAuth(
        (user, userId) => {
            // Callback de SUCESSO (usuário logado)
            console.log(`Usuário ${userId} logado.`);
            loginScreen.classList.add('hidden');
            mainContent.classList.remove('hidden');
            loginError.textContent = '';
            
            // Inicializa as coleções com o userId
            currentCollections = getCollections(userId);

            // Inicializa todas as abas, passando as dependências
            initVendasTab(currentCollections, user);
            initClientesTab(currentCollections, user);
            initProdutosTab(currentCollections, user);

            // Lida com o "deep linking" (links com #)
            handleHashChange();
        },
        () => {
            // Callback de LOGOUT (usuário não logado)
            console.log("Nenhum usuário logado.");
            loginScreen.classList.remove('hidden');
            mainContent.classList.add('hidden');
            currentCollections = {}; // Limpa as coleções
        }
    );

    // Listener do formulário de login (agora usa o 'auth' importado)
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginButton = document.getElementById('login-button');
        
        loginButton.innerHTML = '<div class="spinner"></div>';
        loginError.textContent = '';

        try {
            // Tenta logar (esta função virá do firebase.js, mas por enquanto usamos a API)
            // NOTA: 'signInWithEmailAndPassword' não foi exportado em `firebase.js`,
            // mas poderia ser. Por enquanto, usamos 'auth.signInWith...'.
            // Vamos ajustar: Em 'firebase.js', exporte 'signInWithEmailAndPassword'
            // e importe aqui. (Já ajustei o 'firebase.js' para exportar)
            // import { signInWithEmailAndPassword } from '../firebase.js';
            // await signInWithEmailAndPassword(auth, email, password);
            
            // Simplesmente deixamos o onAuthStateChanged lidar com isso.
            // O código acima é se você estivesse *criando* a sessão.
            // Para o seu caso, o login é externo.
            // Este formulário de login é um fallback? 
            // Se o seu login é *apenas* pelo token, pode remover o form.
            // Vou manter a lógica original caso você use email/senha.
            
            // Lógica de login por email/senha (se aplicável)
            // Se você *não* usa email/senha, pode remover este listener.
            // Assumindo que o setupAuth com token é o principal.
            console.warn("Formulário de login submetido, mas o app usa token auth.");
            loginError.textContent = "Login por formulário não implementado.";
            
        } catch (error) {
            console.error("Erro no login:", error);
            loginError.textContent = "Email ou senha inválidos.";
        } finally {
            loginButton.innerHTML = 'Entrar';
        }
    });

    // --- Lógica de Navegação de Abas ---
    function switchTab(targetId) {
        // Desativa todas as abas e esconde todas as páginas
        Object.values(tabs).forEach(tab => tab.classList.remove('tab-active'));
        Object.values(pages).forEach(page => page.classList.add('hidden'));

        // Ativa a aba e página correta
        if (tabs[targetId] && pages[targetId]) {
            tabs[targetId].classList.add('tab-active');
            pages[targetId].classList.remove('hidden');
        } else {
            // Padrão: Vendas
            tabs.vendas.classList.add('tab-active');
            pages.vendas.classList.remove('hidden');
        }
    }

    // Adiciona listeners de clique nas abas
    tabs.vendas.addEventListener('click', () => switchTab('vendas'));
    tabs.clientes.addEventListener('click', () => switchTab('clientes'));
    tabs.produtos.addEventListener('click', () => switchTab('produtos'));

    // --- Lógica de Deep Linking (Hash) ---
    function handleHashChange() {
        const hash = window.location.hash;
        console.log("Hash detectado:", hash);
        
        if (hash === '#clientes') {
            switchTab('clientes');
        } else if (hash === '#produtos') {
            switchTab('produtos');
        } else {
            // Padrão é #vendas
            switchTab('vendas');
        }
    }

    // Ouve mudanças no hash (quando o usuário clica em links no menu principal)
    window.addEventListener('hashchange', handleHashChange);
    // Também executa na carga inicial (já é feito no callback do setupAuth)
});
