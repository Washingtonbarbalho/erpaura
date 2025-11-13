// modules/vendas/tab_vendas.js
// Contém toda a lógica exclusiva da aba "Vendas"

import { db, doc, getDoc, onSnapshot, query, where, Timestamp, writeBatch, serverTimestamp, updateDoc, deleteDoc, addDoc } from '../firebase.js';
import { formatCurrency, formatDate, showToast, createSpinner, formatAddress } from '../utils.js';

// Variáveis de estado do módulo
let allSales = [];
let allClients = []; // Necessário para o modal
let allProducts = []; // Necessário para o modal
let currentSaleItems = [];
let editingSaleId = null;

// Referências de Coleções (serão passadas)
let salesCollection, clientsCollection, productsCollection, parcelasCollection, pagamentosHistoricoCollection;

// Elementos DOM
let pageVendas, searchVendas, filterDate, filterDateBtn, openVendaModalBtn, summaryTotal, summaryRecebido, summaryAReceber, summaryCount, salesList;
let vendaModal, closeVendaModal, vendaModalTitle, vendaForm, vendaId, vendaClienteSelect, vendaClienteCpf, vendaClienteInfo, vendaAddItemSection, vendaProdutoSelect, vendaItemQty, vendaItemPrice, vendaAddItemBtn, vendaItemsList, vendaItemActionHeader, vendaEndereco, vendaObs, vendaSubtotal, vendaDesconto, vendaTotal, vendaFormaPgto, vendaPgtoDinheiro, vendaValorPago, vendaTroco, vendaPgtoPrazo, vendaStatusSection, vendaStatusText, vendaDeleteBtn, vendaPrintBtn, vendaSaveBtn;

/**
 * Inicializa a Aba de Vendas
 * @param {object} collections - Objeto com as referências das coleções do Firestore
 * @param {object} user - Objeto do usuário autenticado
 */
export function initVendasTab(collections, user) {
    // Define as coleções para este módulo
    salesCollection = collections.salesCollection;
    clientsCollection = collections.clientsCollection;
    productsCollection = collections.productsCollection;
    parcelasCollection = collections.parcelasCollection;
    pagamentosHistoricoCollection = collections.pagamentosHistoricoCollection;

    // Obtém referências do DOM (só precisa fazer isso uma vez)
    bindDOMelements();

    // Configura os listeners de eventos (botões, modais, etc.)
    setupEventListeners();

    // Carrega dados iniciais e configura listeners do Firestore
    loadInitialData();
}

function bindDOMelements() {
    // Página e Resumo
    pageVendas = document.getElementById('page-vendas');
    searchVendas = document.getElementById('search-vendas');
    filterDate = document.getElementById('filter-date');
    filterDateBtn = document.getElementById('filter-date-btn');
    openVendaModalBtn = document.getElementById('open-venda-modal');
    summaryTotal = document.getElementById('summary-total');
    summaryRecebido = document.getElementById('summary-recebido');
    summaryAReceber = document.getElementById('summary-a-receber');
    summaryCount = document.getElementById('summary-count');
    salesList = document.getElementById('sales-list');

    // Modal de Venda
    vendaModal = document.getElementById('venda-modal');
    closeVendaModal = document.getElementById('close-venda-modal');
    vendaModalTitle = document.getElementById('venda-modal-title');
    vendaForm = document.getElementById('venda-form');
    vendaId = document.getElementById('venda-id');
    vendaClienteSelect = document.getElementById('venda-cliente-select');
    vendaClienteCpf = document.getElementById('venda-cliente-cpf');
    vendaClienteInfo = document.getElementById('venda-cliente-info');
    vendaAddItemSection = document.getElementById('venda-add-item-section');
    vendaProdutoSelect = document.getElementById('venda-produto-select');
    vendaItemQty = document.getElementById('venda-item-qty');
    vendaItemPrice = document.getElementById('venda-item-price');
    vendaAddItemBtn = document.getElementById('venda-add-item-btn');
    vendaItemsList = document.getElementById('venda-items-list');
    vendaItemActionHeader = document.getElementById('venda-item-action-header');
    vendaEndereco = document.getElementById('venda-endereco');
    vendaObs = document.getElementById('venda-obs');
    vendaSubtotal = document.getElementById('venda-subtotal');
    vendaDesconto = document.getElementById('venda-desconto');
    vendaTotal = document.getElementById('venda-total');
    vendaFormaPgto = document.getElementById('venda-forma-pgto');
    vendaPgtoDinheiro = document.getElementById('venda-pgto-dinheiro');
    vendaValorPago = document.getElementById('venda-valor-pago');
    vendaTroco = document.getElementById('venda-troco');
    vendaPgtoPrazo = document.getElementById('venda-pgto-prazo');
    vendaStatusSection = document.getElementById('venda-status-section');
    vendaStatusText = document.getElementById('venda-status-text');
    vendaDeleteBtn = document.getElementById('venda-delete-btn');
    vendaPrintBtn = document.getElementById('venda-print-btn');
    vendaSaveBtn = document.getElementById('venda-save-btn');
}

function setupEventListeners() {
    // Filtros da página principal
    filterDateBtn.addEventListener('click', renderSalesAndSummary);
    searchVendas.addEventListener('input', renderSalesAndSummary);

    // Abrir/Fechar Modal de Venda
    openVendaModalBtn.addEventListener('click', openNewVendaModal);
    closeVendaModal.addEventListener('click', () => vendaModal.classList.add('hidden'));

    // Lógica do Modal de Venda
    vendaForm.addEventListener('submit', handleSaveVenda);
    vendaClienteSelect.addEventListener('change', updateClienteInfo);
    vendaProdutoSelect.addEventListener('change', updateProdutoPrice);
    vendaAddItemBtn.addEventListener('click', handleAddVendaItem);
    vendaDesconto.addEventListener('input', updateVendaTotals);
    vendaFormaPgto.addEventListener('change', togglePgtoSections);
    vendaValorPago.addEventListener('input', updateTroco);

    // Botões de Ação do Modal
    vendaDeleteBtn.addEventListener('click', handleDeleteVenda);
    vendaPrintBtn.addEventListener('click', generateSalePDF);
}

function loadInitialData() {
    // Listener para Vendas
    onSnapshot(query(salesCollection), (snapshot) => {
        allSales = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            allSales.push({ id: doc.id, ...data, dataVenda: data.dataVenda?.toDate() });
        });
        allSales.sort((a, b) => (b.dataVenda || 0) - (a.dataVenda || 0)); // Mais recentes primeiro
        renderSalesAndSummary();
    }, (error) => console.error("Erro ao carregar vendas: ", error));

    // Listener para Clientes (para o <select> do modal)
    onSnapshot(query(clientsCollection), (snapshot) => {
        allClients = [];
        snapshot.forEach((doc) => allClients.push({ id: doc.id, ...doc.data() }));
        populateClientSelect(); // Atualiza o <select>
    }, (error) => console.error("Erro ao carregar clientes para o modal: ", error));

    // Listener para Produtos (para o <select> do modal)
    onSnapshot(query(productsCollection), (snapshot) => {
        allProducts = [];
        snapshot.forEach((doc) => allProducts.push({ id: doc.id, ...doc.data() }));
        populateProductSelect(); // Atualiza o <select>
    }, (error) => console.error("Erro ao carregar produtos para o modal: ", error));
}

// --- Lógica da Página Principal (Vendas) ---

function renderSalesAndSummary() {
    if (!salesList) return; // Se a aba não foi inicializada

    const searchTerm = searchVendas.value.toLowerCase();
    const filterDateValue = filterDate.value;

    let filteredSales = allSales.filter(sale => {
        // Filtro de Data
        if (filterDateValue) {
            const saleDate = sale.dataVenda.toISOString().split('T')[0];
            if (saleDate !== filterDateValue) {
                return false;
            }
        }
        // Filtro de Busca
        const clientName = sale.clienteInfo.nome || '';
        const saleId = sale.id || '';
        return clientName.toLowerCase().includes(searchTerm) || saleId.toLowerCase().includes(searchTerm);
    });

    salesList.innerHTML = ''; // Limpa a tabela
    if (filteredSales.length === 0) {
        salesList.innerHTML = '<tr><td colspan="6" class="td-cell text-center">Nenhuma venda encontrada.</td></tr>';
    }

    let totalVendido = 0;
    let totalRecebido = 0;
    let totalAReceber = 0;

    filteredSales.forEach(sale => {
        totalVendido += sale.total;
        if (sale.status === 'Pago' || sale.formaPgto === 'Pix' || sale.formaPgto === 'Débito' || sale.formaPgto === 'Crédito') {
            totalRecebido += sale.total;
        } else if (sale.status === 'Aguardando Pagamento') {
            totalAReceber += sale.total;
        }

        const row = document.createElement('tr');
        row.className = 'clickable-row';
        row.innerHTML = `
            <td class="td-cell text-xs">${sale.id.substring(0, 5)}...</td>
            <td class="td-cell">${formatDate(sale.dataVenda)}</td>
            <td class="td-cell td-cell-truncate">${sale.clienteInfo.nome}</td>
            <td class="td-cell font-medium">${formatCurrency(sale.total)}</td>
            <td class="td-cell">${sale.formaPgto}</td>
            <td class="td-cell"><span class="px-2 py-1 rounded-full text-xs font-medium ${sale.status === 'Pago' ? 'bg-green-800 text-green-300' : 'bg-yellow-800 text-yellow-300'}">${sale.status}</span></td>
        `;
        row.addEventListener('click', () => handleSaleClick(sale.id));
        salesList.appendChild(row);
    });

    // Atualiza resumos
    summaryTotal.textContent = formatCurrency(totalVendido);
    summaryRecebido.textContent = formatCurrency(totalRecebido);
    summaryAReceber.textContent = formatCurrency(totalAReceber);
    summaryCount.textContent = filteredSales.length;
}

async function handleSaleClick(saleId) {
    // Lógica para abrir o modal com detalhes da venda
    console.log("Abrindo detalhes da venda:", saleId);
    try {
        const saleDoc = await getDoc(doc(salesCollection, saleId));
        if (!saleDoc.exists()) {
            showToast("Venda não encontrada.", true);
            return;
        }
        const sale = { id: saleDoc.id, ...saleDoc.data() };
        openEditVendaModal(sale);
    } catch (error) {
        console.error("Erro ao buscar venda:", error);
        showToast("Erro ao carregar venda.", true);
    }
}

// --- Lógica do Modal (Nova Venda / Edição) ---

function populateClientSelect() {
    vendaClienteSelect.innerHTML = '<option value="">Selecione um cliente...</option>';
    allClients.sort((a,b) => a.nome.localeCompare(b.nome)); // Ordena por nome
    allClients.forEach(client => {
        const option = document.createElement('option');
        option.value = client.id;
        option.textContent = `${client.nome} (${client.cpfCnpj || 'N/A'})`;
        vendaClienteSelect.appendChild(option);
    });
}

function populateProductSelect() {
    vendaProdutoSelect.innerHTML = '<option value="">Selecione um produto...</option>';
    allProducts.sort((a,b) => a.nome.localeCompare(b.nome)); // Ordena por nome
    allProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.nome} (${formatCurrency(product.precoVenda)})`;
        vendaProdutoSelect.appendChild(option);
    });
}

function updateClienteInfo() {
    const selectedClientId = vendaClienteSelect.value;
    const cliente = allClients.find(c => c.id === selectedClientId);
    
    // Limpa o select de endereço
    vendaEndereco.innerHTML = '';
    
    if (cliente) {
        vendaClienteCpf.value = cliente.cpfCnpj || '';
        vendaClienteInfo.textContent = `Tel: ${cliente.telefone || 'N/A'} | Email: ${cliente.email || 'N/A'}`;
        
        // Popula endereços
        // Adiciona endereço principal
        const mainAddressText = formatAddress(cliente.enderecoPrincipal);
        addAddressOption(mainAddressText, mainAddressText);
        
        // Adiciona endereços de entrega
        if (cliente.enderecosEntrega && Array.isArray(cliente.enderecosEntrega)) {
            cliente.enderecosEntrega.forEach(addr => {
                const addrText = formatAddress(addr);
                addAddressOption(addrText, addrText);
            });
        }
    } else {
        vendaClienteCpf.value = '';
        vendaClienteInfo.textContent = 'Selecione um cliente para ver os detalhes...';
    }
}

function addAddressOption(text, value, isSelected = false) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    option.selected = isSelected;
    vendaEndereco.appendChild(option);
}


function updateProdutoPrice() {
    const selectedProductId = vendaProdutoSelect.value;
    const product = allProducts.find(p => p.id === selectedProductId);
    if (product) {
        vendaItemPrice.value = (product.precoVenda || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('.', '');
    } else {
        vendaItemPrice.value = '0,00';
    }
}

function handleAddVendaItem() {
    const productId = vendaProdutoSelect.value;
    const product = allProducts.find(p => p.id === productId);
    const qty = parseInt(vendaItemQty.value) || 0;
    const price = parseFloat(vendaItemPrice.value.replace('.', '').replace(',', '.')) || 0;

    if (!product || qty <= 0 || price < 0) {
        showToast("Selecione um produto, quantidade e preço válidos.", true);
        return;
    }

    // Adiciona ao array de estado
    currentSaleItems.push({
        id: product.id,
        nome: product.nome,
        qtd: qty,
        precoUnit: price,
        subtotal: qty * price
    });

    renderVendaItemsList();
    updateVendaTotals();

    // Reseta campos
    vendaProdutoSelect.value = '';
    vendaItemQty.value = '1';
    vendaItemPrice.value = '0,00';
}

function renderVendaItemsList() {
    vendaItemsList.innerHTML = '';
    if (currentSaleItems.length === 0) {
        vendaItemsList.innerHTML = '<tr><td colspan="5" class="td-cell text-center">Nenhum item adicionado.</td></tr>';
    }

    currentSaleItems.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="td-cell">${item.nome}</td>
            <td class="td-cell">${item.qtd}</td>
            <td class="td-cell">${formatCurrency(item.precoUnit)}</td>
            <td class="td-cell">${formatCurrency(item.subtotal)}</td>
            <td class="td-cell text-center">
                <button type="button" data-index="${index}" class="remove-item-btn p-1 text-red-500 hover:text-red-400">&times;</button>
            </td>
        `;
        
        // Adiciona listener ao botão de remover (apenas em modo de nova venda)
        const removeBtn = row.querySelector('.remove-item-btn');
        if (editingSaleId) {
            removeBtn.classList.add('hidden'); // Esconde botão se estiver editando
        } else {
            removeBtn.addEventListener('click', () => {
                currentSaleItems.splice(index, 1); // Remove do array
                renderVendaItemsList();
                updateVendaTotals();
            });
        }
        
        vendaItemsList.appendChild(row);
    });
}

function updateVendaTotals() {
    const subtotal = currentSaleItems.reduce((acc, item) => acc + item.subtotal, 0);
    const desconto = parseFloat(vendaDesconto.value.replace('.', '').replace(',', '.')) || 0;
    const total = subtotal - desconto;

    vendaSubtotal.textContent = formatCurrency(subtotal);
    vendaTotal.textContent = formatCurrency(total);
    
    updateTroco();
}

function togglePgtoSections() {
    const forma = vendaFormaPgto.value;
    vendaPgtoDinheiro.classList.toggle('hidden', forma !== 'Dinheiro');
    vendaPgtoPrazo.classList.toggle('hidden', forma !== 'A Prazo (Carnê)');
}

function updateTroco() {
    const total = parseFloat(vendaTotal.textContent.replace('R$', '').replace('.', '').replace(',', '.')) || 0;
    const valorPago = parseFloat(vendaValorPago.value.replace('.', '').replace(',', '.')) || 0;
    const troco = valorPago - total;
    vendaTroco.textContent = formatCurrency(troco > 0 ? troco : 0);
}

function openNewVendaModal() {
    editingSaleId = null;
    vendaForm.reset();
    vendaModalTitle.textContent = "Nova Venda";
    currentSaleItems = [];
    renderVendaItemsList();
    updateVendaTotals();
    
    // Reseta e habilita campos
    vendaClienteSelect.disabled = false;
    vendaAddItemSection.classList.remove('hidden');
    vendaItemActionHeader.classList.remove('hidden');
    vendaFormaPgto.disabled = false;
    vendaDesconto.readOnly = false;
    vendaEndereco.disabled = false;
    vendaObs.readOnly = false;
    vendaValorPago.readOnly = false;
    
    // Esconde botões de edição/detalhe
    vendaDeleteBtn.classList.add('hidden');
    vendaPrintBtn.classList.add('hidden');
    vendaStatusSection.classList.add('hidden');
    
    // Mostra botão de salvar
    vendaSaveBtn.classList.remove('hidden');
    vendaSaveBtn.innerHTML = 'Salvar Venda';
    
    // Popula selects (já devem estar carregados)
    populateClientSelect();
    populateProductSelect();
    
    // Reseta seções de pagamento
    togglePgtoSections();
    
    vendaModal.classList.remove('hidden');
}

function openEditVendaModal(sale) {
    editingSaleId = sale.id;
    vendaForm.reset();
    vendaModalTitle.textContent = `Detalhes da Venda #${sale.id.substring(0, 5)}`;
    
    // Preenche dados
    vendaId.value = sale.id;
    
    // Cliente
    populateClientSelect(); // Popula
    vendaClienteSelect.value = sale.clienteInfo.id; // Seleciona
    updateClienteInfo(); // Atualiza infos
    addAddressOption(sale.enderecoEntrega, sale.enderecoEntrega, true); // Adiciona o endereço salvo
    vendaClienteSelect.disabled = true; // Desabilita
    vendaEndereco.disabled = true;

    // Itens
    currentSaleItems = sale.items;
    renderVendaItemsList();
    vendaAddItemSection.classList.add('hidden');
    vendaItemActionHeader.classList.add('hidden'); // Esconde coluna "Ação"
    
    // Totais e Pagamento
    vendaDesconto.value = (sale.desconto || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    vendaDesconto.readOnly = true;
    updateVendaTotals(); // Calcula subtotal e total
    
    vendaFormaPgto.value = sale.formaPgto;
    vendaFormaPgto.disabled = true;
    togglePgtoSections();

    if (sale.formaPgto === 'Dinheiro') {
        vendaValorPago.value = (sale.valorPago || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
        vendaValorPago.readOnly = true;
        updateTroco();
    }
    
    // Observações
    vendaObs.value = sale.obs || '';
    vendaObs.readOnly = true;

    // Status
    vendaStatusSection.classList.remove('hidden');
    vendaStatusText.textContent = sale.status;
    vendaStatusText.className = `text-lg font-semibold p-3 bg-gray-900 rounded-lg ${sale.status === 'Pago' ? 'text-green-400' : 'text-yellow-400'}`;

    // Botões
    vendaSaveBtn.classList.add('hidden'); // Esconde salvar
    vendaPrintBtn.classList.remove('hidden'); // Mostra imprimir
    
    // Só permite excluir se não for "A Prazo (Carnê)"
    if (sale.formaPgto !== 'A Prazo (Carnê)') {
        vendaDeleteBtn.classList.remove('hidden');
    } else {
        vendaDeleteBtn.classList.add('hidden');
    }

    vendaModal.classList.remove('hidden');
}

async function handleSaveVenda(e) {
    e.preventDefault();
    if (editingSaleId) return; // Não salva se estiver em modo de edição

    const saveButton = vendaSaveBtn;
    saveButton.disabled = true;
    saveButton.innerHTML = '<div class="spinner"></div>';
    
    try {
        const clienteId = vendaClienteSelect.value;
        const cliente = allClients.find(c => c.id === clienteId);
        const formaPgto = vendaFormaPgto.value;
        const total = parseFloat(vendaTotal.textContent.replace('R$', '').replace('.', '').replace(',', '.')) || 0;

        if (!cliente || currentSaleItems.length === 0 || !formaPgto) {
            throw new Error("Cliente, itens e forma de pagamento são obrigatórios.");
        }

        let status = 'Pago';
        if (formaPgto === 'A Prazo (Carnê)') {
            status = 'Aguardando Pagamento';
        }

        const vendaData = {
            clienteInfo: {
                id: cliente.id,
                nome: cliente.nome,
                cpfCnpj: cliente.cpfCnpj
            },
            items: currentSaleItems,
            subtotal: currentSaleItems.reduce((acc, item) => acc + item.subtotal, 0),
            desconto: parseFloat(vendaDesconto.value.replace('.', '').replace(',', '.')) || 0,
            total: total,
            formaPgto: formaPgto,
            status: status,
            dataVenda: serverTimestamp(),
            enderecoEntrega: vendaEndereco.value,
            obs: vendaObs.value,
            valorPago: (formaPgto === 'Dinheiro') ? (parseFloat(vendaValorPago.value.replace('.', '').replace(',', '.')) || 0) : 0
        };

        // Salva a venda
        const vendaDocRef = await addDoc(salesCollection, vendaData);
        
        // Se for "A Prazo (Carnê)", gera o carnê
        if (formaPgto === 'A Prazo (Carnê)') {
            // Supondo que você tem uma função 'generateCarne' em algum lugar.
            // Por simplicidade, vamos apenas criar a primeira parcela aqui como exemplo.
            // O ideal é ter um modal para definir as parcelas.
            // *** SIMPLIFICAÇÃO: Criando uma parcela única ***
            await addDoc(parcelasCollection, {
                vendaId: vendaDocRef.id,
                clienteId: cliente.id,
                clienteNome: cliente.nome,
                valor: total,
                numParcela: 1,
                totalParcelas: 1,
                dataVencimento: Timestamp.fromDate(new Date(new Date().setMonth(new Date().getMonth() + 1))), // Vence em 30 dias
                status: 'Pendente',
                dataPagamento: null
            });
        }
        
        // TODO: Atualizar estoque (batch write)

        showToast("Venda salva com sucesso!");
        vendaModal.classList.add('hidden');

    } catch (error) {
        console.error("Erro ao salvar venda:", error);
        showToast(`Erro ao salvar venda: ${error.message}`, true);
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = 'Salvar Venda';
    }
}

async function handleDeleteVenda() {
    if (!editingSaleId) return;

    if (!confirm("Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.")) {
        return;
    }

    vendaDeleteBtn.disabled = true;
    vendaDeleteBtn.innerHTML = '<div class="spinner"></div>';
    
    try {
        const saleDocRef = doc(salesCollection, editingSaleId);
        const saleDoc = await getDoc(saleDocRef);
        const saleData = saleDoc.data();

        // Não permite excluir venda com carnê
        if (saleData.formaPgto === 'A Prazo (Carnê)') {
            throw new Error("Não é possível excluir uma venda que gerou um carnê.");
        }

        // TODO: Reverter estoque se necessário

        await deleteDoc(saleDocRef);

        showToast("Venda excluída com sucesso!");
        vendaModal.classList.add('hidden');
        editingSaleId = null;

    } catch (error) {
        console.error("Erro ao excluir venda:", error);
        showToast(`Erro ao excluir venda: ${error.message}`, true);
    } finally {
        vendaDeleteBtn.disabled = false;
        vendaDeleteBtn.innerHTML = 'Excluir Venda';
    }
}

function generateSalePDF() {
    // Lógica para gerar PDF (ex: jsPDF)
    // ...
    showToast("Função de impressão ainda não implementada.", true);
    console.log("Imprimindo recibo da venda:", editingSaleId);
}
