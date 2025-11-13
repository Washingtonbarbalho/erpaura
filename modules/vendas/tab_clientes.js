// modules/vendas/tab_clientes.js
// Contém toda a lógica exclusiva da aba "Clientes"

import { db, doc, onSnapshot, query, setDoc, addDoc, updateDoc, deleteDoc, getDocs, where } from '../firebase.js';
import { showToast, createSpinner, debounce, formatAddress } from '../utils.js';

// Variáveis de estado do módulo
let allClients = [];
let editingClientId = null;
let currentPage = 1;
const ITEMS_PER_PAGE = 10;
let filteredClients = [];

// Referências de Coleções (serão passadas)
let clientsCollection, salesCollection;

// Elementos DOM
let pageClientes, searchClientes, openClienteModalBtn, clientList, clientPagination;
let clienteModal, closeClienteModal, clienteModalTitle, clienteForm, clienteId, clienteNome, clienteCpf, clienteTelefone, clienteEmail, clienteNascimento, clienteCep, clienteLogradouro, clienteNumero, clienteComplemento, clienteBairro, clienteCidade, clienteEstado, addEnderecoEntregaBtn, enderecosEntregaContainer, clienteDeleteBtn, clienteSaveBtn;

/**
 * Inicializa a Aba de Clientes
 * @param {object} collections - Objeto com as referências das coleções do Firestore
 * @param {object} user - Objeto do usuário autenticado
 */
export function initClientesTab(collections, user) {
    clientsCollection = collections.clientsCollection;
    salesCollection = collections.salesCollection; // Para verificar vendas antes de excluir

    bindDOMelements();
    setupEventListeners();
    loadInitialData();
}

function bindDOMelements() {
    pageClientes = document.getElementById('page-clientes');
    searchClientes = document.getElementById('search-clientes');
    openClienteModalBtn = document.getElementById('open-cliente-modal');
    clientList = document.getElementById('client-list');
    clientPagination = document.getElementById('client-pagination');

    // Modal de Cliente
    clienteModal = document.getElementById('cliente-modal');
    closeClienteModal = document.getElementById('close-cliente-modal');
    clienteModalTitle = document.getElementById('cliente-modal-title');
    clienteForm = document.getElementById('cliente-form');
    clienteId = document.getElementById('cliente-id');
    clienteNome = document.getElementById('cliente-nome');
    clienteCpf = document.getElementById('cliente-cpf');
    clienteTelefone = document.getElementById('cliente-telefone');
    clienteEmail = document.getElementById('cliente-email');
    clienteNascimento = document.getElementById('cliente-nascimento');
    clienteCep = document.getElementById('cliente-cep');
    clienteLogradouro = document.getElementById('cliente-logradouro');
    clienteNumero = document.getElementById('cliente-numero');
    clienteComplemento = document.getElementById('cliente-complemento');
    clienteBairro = document.getElementById('cliente-bairro');
    clienteCidade = document.getElementById('cliente-cidade');
    clienteEstado = document.getElementById('cliente-estado');
    addEnderecoEntregaBtn = document.getElementById('add-endereco-entrega');
    enderecosEntregaContainer = document.getElementById('enderecos-entrega-container');
    clienteDeleteBtn = document.getElementById('cliente-delete-btn');
    clienteSaveBtn = document.getElementById('cliente-save-btn');
}

function setupEventListeners() {
    // Busca (com debounce)
    searchClientes.addEventListener('input', debounce(applyFiltersAndRenderClients, 300));

    // Abrir/Fechar Modal
    openClienteModalBtn.addEventListener('click', openNewClienteModal);
    closeClienteModal.addEventListener('click', () => clienteModal.classList.add('hidden'));

    // Lógica do Modal
    clienteForm.addEventListener('submit', handleSaveCliente);
    clienteDeleteBtn.addEventListener('click', handleDeleteCliente);
    addEnderecoEntregaBtn.addEventListener('click', () => addEnderecoEntregaForm());
    
    // Busca de CEP
    clienteCep.addEventListener('blur', handleCepSearch);
}

function loadInitialData() {
    // Listener para Clientes
    onSnapshot(query(clientsCollection), (snapshot) => {
        allClients = [];
        snapshot.forEach((doc) => allClients.push({ id: doc.id, ...doc.data() }));
        allClients.sort((a,b) => a.nome.localeCompare(b.nome)); // Ordena por nome
        applyFiltersAndRenderClients();
    }, (error) => console.error("Erro ao carregar clientes: ", error));
}

// --- Lógica da Página Principal (Clientes) ---

function applyFiltersAndRenderClients() {
    const searchTerm = searchClientes.value.toLowerCase();
    
    filteredClients = allClients.filter(client => {
        return (
            client.nome.toLowerCase().includes(searchTerm) ||
            (client.cpfCnpj || '').toLowerCase().includes(searchTerm) ||
            (client.telefone || '').toLowerCase().includes(searchTerm)
        );
    });
    
    currentPage = 1; // Reseta para a primeira página
    renderClientsAndPagination();
}

function renderClientsAndPagination() {
    clientList.innerHTML = '';
    
    if (filteredClients.length === 0) {
        clientList.innerHTML = '<tr><td colspan="5" class="td-cell text-center">Nenhum cliente encontrado.</td></tr>';
        clientPagination.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const clientsToShow = filteredClients.slice(startIndex, endIndex);

    clientsToShow.forEach(client => {
        const row = document.createElement('tr');
        row.className = 'clickable-row';
        row.innerHTML = `
            <td class="td-cell font-medium">${client.nome}</td>
            <td class="td-cell">${client.cpfCnpj || 'N/A'}</td>
            <td class="td-cell">${client.telefone || 'N/A'}</td>
            <td class="td-cell td-cell-truncate">${client.email || 'N/A'}</td>
            <td class="td-cell">${(client.enderecoPrincipal && client.enderecoPrincipal.cidade) ? client.enderecoPrincipal.cidade : 'N/A'}</td>
        `;
        row.addEventListener('click', () => openEditClienteModal(client));
        clientList.appendChild(row);
    });

    // Renderiza Paginação
    renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
    clientPagination.innerHTML = '';
    
    // Botão "Anterior"
    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Anterior';
    prevBtn.className = 'pagination-btn';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderClientsAndPagination();
        }
    });
    clientPagination.appendChild(prevBtn);

    // Info da Página
    const pageInfo = document.createElement('span');
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    pageInfo.className = 'text-sm text-gray-400';
    clientPagination.appendChild(pageInfo);
    
    // Botão "Próximo"
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Próximo';
    nextBtn.className = 'pagination-btn';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderClientsAndPagination();
        }
    });
    clientPagination.appendChild(nextBtn);
}


// --- Lógica do Modal (Novo Cliente / Edição) ---

function openNewClienteModal() {
    editingClientId = null;
    clienteForm.reset();
    clienteModalTitle.textContent = "Novo Cliente";
    clienteDeleteBtn.classList.add('hidden');
    clienteSaveBtn.innerHTML = 'Salvar Cliente';
    enderecosEntregaContainer.innerHTML = ''; // Limpa endereços extras
    clienteModal.classList.remove('hidden');
}

function openEditClienteModal(client) {
    editingClientId = client.id;
    clienteForm.reset();
    clienteModalTitle.textContent = "Editar Cliente";
    clienteDeleteBtn.classList.remove('hidden');
    clienteSaveBtn.innerHTML = 'Atualizar Cliente';
    enderecosEntregaContainer.innerHTML = ''; // Limpa antes de preencher
    
    // Preenche dados pessoais
    clienteId.value = client.id;
    clienteNome.value = client.nome;
    clienteCpf.value = client.cpfCnpj;
    clienteTelefone.value = client.telefone;
    clienteEmail.value = client.email;
    clienteNascimento.value = client.dataNascimento; // Assume formato YYYY-MM-DD
    
    // Preenche Endereço Principal
    if (client.enderecoPrincipal) {
        const addr = client.enderecoPrincipal;
        clienteCep.value = addr.cep || '';
        clienteLogradouro.value = addr.logradouro || '';
        clienteNumero.value = addr.numero || '';
        clienteComplemento.value = addr.complemento || '';
        clienteBairro.value = addr.bairro || '';
        clienteCidade.value = addr.cidade || '';
        clienteEstado.value = addr.estado || '';
    }
    
    // Preenche Endereços de Entrega
    if (client.enderecosEntrega && Array.isArray(client.enderecosEntrega)) {
        client.enderecosEntrega.forEach(addr => addEnderecoEntregaForm(addr));
    }
    
    clienteModal.classList.remove('hidden');
}

async function handleSaveCliente(e) {
    e.preventDefault();
    
    clienteSaveBtn.disabled = true;
    clienteSaveBtn.innerHTML = '<div class="spinner"></div>';

    try {
        const clienteData = {
            nome: clienteNome.value,
            cpfCnpj: clienteCpf.value,
            telefone: clienteTelefone.value,
            email: clienteEmail.value,
            dataNascimento: clienteNascimento.value,
            enderecoPrincipal: {
                cep: clienteCep.value,
                logradouro: clienteLogradouro.value,
                numero: clienteNumero.value,
                complemento: clienteComplemento.value,
                bairro: clienteBairro.value,
                cidade: clienteCidade.value,
                estado: clienteEstado.value
            },
            enderecosEntrega: getEnderecosEntregaFromForm()
        };
        
        let docRef;
        if (editingClientId) {
            // Atualiza cliente existente
            docRef = doc(clientsCollection, editingClientId);
            await updateDoc(docRef, clienteData);
            showToast("Cliente atualizado com sucesso!");
        } else {
            // Cria novo cliente
            // Verifica se CPF/CNPJ já existe
            const q = query(clientsCollection, where("cpfCnpj", "==", clienteData.cpfCnpj));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                throw new Error("CPF/CNPJ já cadastrado.");
            }
            docRef = await addDoc(clientsCollection, clienteData);
            showToast("Cliente salvo com sucesso!");
        }
        
        clienteModal.classList.add('hidden');

    } catch (error) {
        console.error("Erro ao salvar cliente:", error);
        showToast(`Erro ao salvar cliente: ${error.message}`, true);
    } finally {
        clienteSaveBtn.disabled = false;
        clienteSaveBtn.innerHTML = editingClientId ? 'Atualizar Cliente' : 'Salvar Cliente';
    }
}

async function handleDeleteCliente() {
    if (!editingClientId) return;

    // Verifica se o cliente tem vendas associadas
    try {
        const q = query(salesCollection, where("clienteInfo.id", "==", editingClientId));
        const salesSnapshot = await getDocs(q);
        if (!salesSnapshot.empty) {
            showToast("Não é possível excluir. Este cliente possui vendas associadas.", true);
            return;
        }
    } catch (error) {
         showToast("Erro ao verificar vendas do cliente.", true);
         return;
    }
    
    if (!confirm("Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.")) {
        return;
    }

    clienteDeleteBtn.disabled = true;
    clienteDeleteBtn.innerHTML = '<div class="spinner"></div>';
    
    try {
        await deleteDoc(doc(clientsCollection, editingClientId));
        showToast("Cliente excluído com sucesso!");
        clienteModal.classList.add('hidden');
        editingClientId = null;
    } catch (error) {
        console.error("Erro ao excluir cliente:", error);
        showToast(`Erro ao excluir cliente: ${error.message}`, true);
    } finally {
        clienteDeleteBtn.disabled = false;
        clienteDeleteBtn.innerHTML = 'Excluir Cliente';
    }
}

// --- Lógica de Endereços de Entrega ---

function addEnderecoEntregaForm(addr = {}) {
    const div = document.createElement('div');
    div.className = 'p-3 border border-gray-600 rounded-lg space-y-3 relative';
    
    div.innerHTML = `
        <button type="button" class="remove-endereco-btn absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center font-bold">&times;</button>
        <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div class="md:col-span-2"><input type="text" class="form-input cep-entrega" placeholder="CEP" value="${addr.cep || ''}"></div>
            <div class="md:col-span-4"><input type="text" class="form-input logradouro-entrega" placeholder="Logradouro" value="${addr.logradouro || ''}"></div>
            <div class="md:col-span-2"><input type="text" class="form-input numero-entrega" placeholder="Número" value="${addr.numero || ''}"></div>
            <div class="md:col-span-4"><input type="text" class="form-input complemento-entrega" placeholder="Complemento" value="${addr.complemento || ''}"></div>
            <div class="md:col-span-2"><input type="text" class="form-input bairro-entrega" placeholder="Bairro" value="${addr.bairro || ''}"></div>
            <div class="md:col-span-2"><input type="text" class="form-input cidade-entrega" placeholder="Cidade" value="${addr.cidade || ''}"></div>
            <div class="md:col-span-2"><input type="text" class="form-input estado-entrega" placeholder="Estado" value="${addr.estado || ''}"></div>
        </div>
    `;
    
    div.querySelector('.remove-endereco-btn').addEventListener('click', () => div.remove());
    
    // Adiciona o listener de busca de CEP ao novo campo
    div.querySelector('.cep-entrega').addEventListener('blur', (e) => handleCepSearch(e, div));
    
    enderecosEntregaContainer.appendChild(div);
}

function getEnderecosEntregaFromForm() {
    const enderecos = [];
    enderecosEntregaContainer.querySelectorAll('.p-3').forEach(div => {
        enderecos.push({
            cep: div.querySelector('.cep-entrega').value,
            logradouro: div.querySelector('.logradouro-entrega').value,
            numero: div.querySelector('.numero-entrega').value,
            complemento: div.querySelector('.complemento-entrega').value,
            bairro: div.querySelector('.bairro-entrega').value,
            cidade: div.querySelector('.cidade-entrega').value,
            estado: div.querySelector('.estado-entrega').value,
        });
    });
    return enderecos;
}

// --- Lógica de Busca de CEP ---

async function handleCepSearch(event, container = null) {
    const cep = event.target.value.replace(/\D/g, ''); // Remove não-números
    if (cep.length !== 8) return; // CEP inválido

    const logradouroInput = container ? container.querySelector('.logradouro-entrega') : clienteLogradouro;
    const bairroInput = container ? container.querySelector('.bairro-entrega') : clienteBairro;
    const cidadeInput = container ? container.querySelector('.cidade-entrega') : clienteCidade;
    const estadoInput = container ? container.querySelector('.estado-entrega') : clienteEstado;

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        if (!response.ok) throw new Error('CEP não encontrado');
        const data = await response.json();
        
        if (data.erro) {
            showToast("CEP não encontrado.", true);
            return;
        }

        logradouroInput.value = data.logradouro;
        bairroInput.value = data.bairro;
        cidadeInput.value = data.localidade;
        estadoInput.value = data.uf;

    } catch (error) {
        console.error("Erro ao buscar CEP:", error);
        showToast("Erro ao consultar CEP.", true);
    }
}
