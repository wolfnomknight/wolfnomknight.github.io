// assets/js/auth.js

// Função de callback global para o login do Google
function handleCredentialResponse(response) {
    console.log("Token recebido:", response.credential);
    const idToken = response.credential;
    
    // 1. Enviar o token para o backend para verificação e criação/login do usuário
    fetch('https://seu-backend.com/auth/google', { // <-- Endpoint que vamos criar depois
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: idToken }),
    })
    .then(res => res.json())
    .then(data => {
        if (data.sessionToken) {
            // 2. Salvar o "token de sessão" do nosso backend no localStorage
            // Este token será usado para autenticar as chamadas às nossas ferramentas
            localStorage.setItem('sessionToken', data.sessionToken);
            
            // 3. Atualizar a UI para mostrar que o usuário está logado
            updateLoginUI(true, data.user);
        } else {
            console.error("Falha na autenticação do backend:", data.error);
        }
    })
    .catch(error => console.error('Erro ao verificar token no backend:', error));
}

// Função para fazer logout
function handleLogout() {
    localStorage.removeItem('sessionToken');
    // Você pode querer invalidar o token no backend também no futuro
    updateLoginUI(false, null);
    // Recarrega a página para limpar o estado
    window.location.reload(); 
}

// Função para atualizar a UI com base no estado de login
function updateLoginUI(isLoggedIn, userData) {
    const userProfileElement = document.getElementById('user-profile-display');
    const loginButtonElement = document.getElementById('google-login-button-container');

    if (isLoggedIn && userProfileElement) {
        // Mostra o perfil do usuário e o botão de logout
        userProfileElement.innerHTML = `
            <span class="user-greeting">Olá, ${userData.displayName}</span>
            <button id="logout-btn" class="btn btn-sm btn-outline-secondary">Sair</button>
        `;
        // Adiciona o evento de clique ao botão de logout recém-criado
        document.getElementById('logout-btn').addEventListener('click', handleLogout);
        
        if (loginButtonElement) loginButtonElement.style.display = 'none';
    } else {
        // Mostra o botão de login do Google
        if (userProfileElement) userProfileElement.innerHTML = '';
        if (loginButtonElement) loginButtonElement.style.display = 'block';
    }
}

// Verifica o estado de login quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('sessionToken');
    if (token) {
        // Se temos um token, poderíamos verificar sua validade com o backend
        // Por agora, vamos assumir que é válido e atualizar a UI.
        // No futuro, você faria uma chamada a um endpoint /me para pegar os dados do usuário.
        // Por simplicidade, vamos pular essa parte agora e focar no fluxo de login.
        // updateLoginUI(true, { displayName: "Usuário" }); // Exemplo simplificado
    }
});