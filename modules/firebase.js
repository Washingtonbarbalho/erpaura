// modules/firebase.js
// Este arquivo inicializa o Firebase e exporta as instâncias e coleções.
// Use 'import { db, auth } from ../firebase.js' em seus outros scripts.

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { 
    getAuth, 
    onAuthStateChanged, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    signInAnonymously,
    signInWithCustomToken,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { 
    getFirestore, 
    collection, 
    doc, 
    addDoc, 
    setDoc, 
    getDoc, 
    getDocs, 
    updateDoc, 
    deleteDoc, 
    onSnapshot, 
    query, 
    where, 
    orderBy, 
    limit,
    Timestamp,
    serverTimestamp,
    writeBatch
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Configuração ---
// Pega as variáveis globais injetadas
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// --- Inicialização ---
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// --- Autenticação ---
// Função para lidar com o login
export async function setupAuth(loginCallback, logoutCallback) {
    // Tenta usar o token inicial se disponível
    if (typeof __initial_auth_token !== 'undefined') {
        try {
            await setPersistence(auth, browserLocalPersistence);
            await signInWithCustomToken(auth, __initial_auth_token);
        } catch (error) {
            console.error("Erro ao logar com Custom Token:", error);
            await signInAnonymously(auth); // Fallback
        }
    } else {
        await signInAnonymously(auth);
    }

    // Listener principal
    onAuthStateChanged(auth, (user) => {
        const userId = user ? user.uid : null;
        if (user) {
            loginCallback(user, userId);
        } else {
            logoutCallback();
        }
    });
    return auth;
}

// Exporta funções de auth que você pode precisar
export { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    onAuthStateChanged
};

// --- Funções do Firestore ---
// Exporta funções do firestore para fácil acesso
export {
    collection, doc, addDoc, setDoc, getDoc, getDocs,
    updateDoc, deleteDoc, onSnapshot, query, where,
    orderBy, limit, Timestamp, serverTimestamp, writeBatch
};

// --- Definição das Coleções ---
// Define e exporta todas as suas coleções baseadas no appId
// Isso centraliza a lógica de "onde" os dados estão.

function getCollectionPath(userId, collectionName, isPublic = false) {
    if (isPublic) {
        return `/artifacts/${appId}/public/data/${collectionName}`;
    }
    if (!userId) {
        console.error("UserID é nulo, não é possível criar caminho da coleção privada.");
        return null;
    }
    return `/artifacts/${appId}/users/${userId}/${collectionName}`;
}

export const getCollections = (userId) => {
    if (!userId) {
        // Retorna um objeto vazio se não houver usuário
        console.warn("Usuário não logado, coleções não inicializadas.");
        return {};
    }
    return {
        // Vendas
        clientsCollection: collection(db, getCollectionPath(userId, 'clientes')),
        productsCollection: collection(db, getCollectionPath(userId, 'produtos')),
        salesCollection: collection(db, getCollectionPath(userId, 'vendas')),
        
        // Carnês
        carnesCollection: collection(db, getCollectionPath(userId, 'carnes')),
        parcelasCollection: collection(db, getCollectionPath(userId, 'parcelas')),
        pagamentosHistoricoCollection: collection(db, getCollectionPath(userId, 'pagamentosHistorico')),

        // Análise
        clientesCreditoCollection: collection(db, getCollectionPath(userId, 'clientesCredito')),

        // Admin
        estoqueCollection: collection(db, getCollectionPath(userId, 'estoque')),
        contasPagarCollection: collection(db, getCollectionPath(userId, 'contasPagar')),
        contasAReceberManualCollection: collection(db, getCollectionPath(userId, 'contasAReceberManual')),
        // ... adicione outras coleções aqui
    };
};
