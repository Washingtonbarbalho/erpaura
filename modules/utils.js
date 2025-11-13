// modules/utils.js
// Funções úteis que podem ser compartilhadas por todo o sistema.

/**
 * Formata um número como moeda BRL.
 * @param {number} value O número a ser formatado.
 * @returns {string} A string formatada (ex: "R$ 1.234,56").
 */
export function formatCurrency(value) {
    if (typeof value !== 'number') {
        value = parseFloat(value) || 0;
    }
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Formata um objeto Date (ou timestamp) para o padrão "dd/mm/aaaa".
 * @param {Date | object} dateInput O objeto Date ou um Timestamp do Firebase.
 * @returns {string} A data formatada.
 */
export function formatDate(dateInput) {
    if (!dateInput) return "N/A";
    let date;
    // Converte timestamp do Firebase se necessário
    if (typeof dateInput.toDate === 'function') {
        date = dateInput.toDate();
    } else if (dateInput instanceof Date) {
        date = dateInput;
    } else {
        return "Data inválida";
    }
    
    // Verifica se a data é válida após a conversão
    if (isNaN(date.getTime())) {
        return "Data inválida";
    }

    return date.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

/**
 * Exibe uma notificação flutuante (toast).
 * @param {string} message A mensagem a ser exibida.
 * @param {boolean} isError Se é uma mensagem de erro (fundo vermelho).
 */
export function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = `fixed bottom-5 right-5 p-4 rounded-lg shadow-lg text-white z-50 ${isError ? 'bg-red-600' : 'bg-green-600'}`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

/**
 * Cria um elemento de spinner (loading).
 * @returns {HTMLElement} O elemento <div> do spinner.
 */
export function createSpinner() {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    return spinner;
}

/**
 * Formata um objeto de endereço em uma string legível.
 * @param {object} addr O objeto de endereço.
 * @returns {string} A string de endereço formatada.
 */
export function formatAddress(addr) {
    if (!addr) return "Endereço não informado";
    return `${addr.logradouro || ''}, ${addr.numero || 'S/N'}${addr.complemento ? ' - ' + addr.complemento : ''} - ${addr.bairro || ''}, ${addr.cidade || ''} - ${addr.estado || ''}, CEP: ${addr.cep || ''}`;
}

/**
* Debounce: Atraso na execução de uma função (útil para campos de busca).
* @param {function} func A função a ser executada.
* @param {number} delay O tempo de espera em milissegundos.
* @returns {function} A nova função "debounced".
*/
export function debounce(func, delay = 300) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
