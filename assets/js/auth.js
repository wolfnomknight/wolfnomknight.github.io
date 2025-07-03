// assets/js/auth.js

// Função de callback global para o login do Google
function handleCredentialResponse(response) {
    const idToken = response.credential;
    console.log("Token recebido:", idToken);
    
    // 1. Enviar o token para o backend para verificação e criação/login do usuário
    fetch('https://news-verifier-163762341148.southamerica-east1.run.app/auth/google', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: idToken }),
    })
    .then(res => {
        if (!res.ok) throw new Error('Falha na resposta do backend durante a autenticação.');
        return res.json();
    })
    .then(data => {
        if (data.sessionToken && data.user) {
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
    updateLoginUI(false, null);
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
    // const userProfileElement = document.getElementById('user-profile-display');
    const loginContainer = document.getElementById('google-login-button-container');
    const userProfileContainer = document.getElementById('user-profile-display');
    // const loginButtonElement = document.getElementById('google-login-button-container');

    if (isLoggedIn && userData) {
        // Esconder o botão de login
        if (loginContainer) {
            loginContainer.style.display = 'none';
        }

        // Mostra o perfil do usuário e o botão de logout
        if (userProfileContainer) {
            const firstName = userData.displayName.split(' ')[0];
            userProfileContainer.innerHTML = `
                <span class="user-greeting text-black text-primary display-4">Olá, ${firstName}</span>
                <button id="logout-btn" class="btn btn-sm btn-dark rounded-pill">Sair</button>
                `;
            // Adiciona o evento de clique ao botão de logout recém-criado
            document.getElementById('logout-btn').addEventListener('click', handleLogout);
            userProfileContainer.style.display = 'flex';
        }
                
    } else {
        // Mostra o botão de login do Google
        if (loginContainer) {
            loginContainer.style.display = 'block';
        }
        // Esconde o container de info do usuário
        if (userProfileContainer) {
            userProfileContainer.style.display = 'none';
            userProfileContainer.innerHTML = '';
        }
    }
}

// Verifica o estado de login quando a página carrega
document.addEventListener('DOMContentLoaded', async () => {
    const sessionToken = localStorage.getItem('sessionToken');
    if (sessionToken) {
        console.log("Token encontrado. Usuário previamente logado. Verificando...");

        try {
            const response = await fetch('https://news-verifier-163762341148.southamerica-east1.run.app/auth/me', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${sessionToken}`
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log("Sessão válida. Olá, ", data.user.displayName);
                    updateLoginUI(true, data.user);
                } else {
                    console.log("Sessão inválida ou expirada.");
                    localStorage.removeItem('sessionToken');
                    updateLoginUI(false, null);
                }
        } catch (error) {
            console.error("Erro ao verificar a sessão: ", error);
            updateLoginUI(false, null);
        }

    } else {
        console.log("Nenhum token encontrado. Usuário deslogado.");
        updateLoginUI(false, null);
    }
});