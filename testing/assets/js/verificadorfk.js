document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // 1. SELEÇÃO DE ELEMENTOS DO DOM
    // =================================================================
    const analyzeBtn = document.getElementById('analyze-btn');
    const loader = document.getElementById('loader');
    const resultsDiv = document.getElementById('results');

    // Elementos das abas
    const activeTabSelector = '#analysisTabs .nav-link.active';
    const inputUrl = document.getElementById('input-url');
    const inputText = document.getElementById('input-text');

    // Elementos da área de upload de arquivo
    const dropZone = document.getElementById('file-drop-zone');
    const inputFile = document.getElementById('input-file');
    const inputFileContext = document.getElementById('input-file-context');
    const fileNameDisplay = document.getElementById('file-name-display');

    const backendUrl = 'https://news-verifier-163762341148.southamerica-east1.run.app/analyze-media'; // <-- ATUALIZE ESTA URL QUANDO FIZER O DEPLOY

    // Aciona o input de arquivo escondido quando o usuário clica na área
    dropZone.addEventListener('click', () => inputFile.click());

    // Impede o comportamento padrão do navegador
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Adiciona o realce visual quando um arquivo é arrastado sobre a área
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
    });

    // Remove o realce visual
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
    });

    // Lida com o arquivo que foi solto na área
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }, false);
    
    // Lida com a seleção de arquivo através da janela de diálogo (após o clique)
    inputFile.addEventListener('change', () => {
        handleFiles(inputFile.files);
    });

    // Lida com arquivos colados (Ctrl+V / Cmd+V)
    document.addEventListener('paste', (e) => {
        // Verifica se a aba de arquivo está ativa antes de processar
        const activeTab = document.querySelector(activeTabSelector);
        if (activeTab && activeTab.id === 'file-tab') {
            handleFiles(e.clipboardData.files);
        }
    });

    /**
     * Função central para processar o arquivo selecionado (de qualquer método)
     * @param {FileList} files A lista de arquivos obtida do evento.
     */
    function handleFiles(files) {
        if (files.length > 0) {
            // Atribui o arquivo ao nosso input escondido. Esta é a chave!
            inputFile.files = files;
            // Mostra o nome do arquivo para o usuário
            fileNameDisplay.textContent = `Arquivo selecionado: ${files[0].name}`;
        }
    }

    // =================================================================
    // EVENTO PRINCIPAL DE CLIQUE
    // =================================================================
    analyzeBtn.addEventListener('click', async () => {
        const activeTab = document.querySelector(activeTabSelector);
        if (!activeTab) return;

        // Limpa resultados anteriores e mostra o loader
        resultsDiv.innerHTML = '';
        showLoader(true);

        try {
            // Delega a lógica para a função correta com base na aba ativa
            switch (activeTab.id) {
                case 'link-tab':
                    await handleLinkAnalysis();
                    break;
                case 'text-tab':
                    await handleTextAnalysis();
                    break;
                case 'file-tab':
                    await handleFileAnalysis();
                    break;
                default:
                    showError('Tipo de análise desconhecido.');
            }
        } catch (error) {
            showError('Falha crítica na comunicação com o servidor: ' + error.message);
        } finally {
            showLoader(false);
        }
    });

    // =================================================================
    // 3. FUNÇÕES DE MANIPULAÇÃO PARA CADA TIPO DE ANÁLISE
    // =================================================================

    /**
     * Lida com a análise de URL.
     */
    async function handleLinkAnalysis() {
        const url = inputUrl.value.trim();
        if (!isValidUrl(url)) {
            showError('Por favor, insira uma URL válida.');
            return;
        }

        // Usamos FormData para manter um padrão de requisição.
        const formData = new FormData();
        formData.append('analysis_type', 'url');
        formData.append('url', url);

        await sendRequest(formData);
    }

    /**
     * Lida com a análise de Texto.
     */
    async function handleTextAnalysis() {
        const text = inputText.value.trim();
        if (!text) {
            showError('Por favor, insira um texto para ser analisado.');
            return;
        }

        const formData = new FormData();
        formData.append('analysis_type', 'text');
        formData.append('text_content', text);

        await sendRequest(formData);
    }

    /**
     * Lida com a análise de Arquivo.
     */
    async function handleFileAnalysis() {
        const file = inputFile.files[0];
        const context = inputFileContext.value.trim();

        if (!file) {
            showError('Por favor, selecione um arquivo para ser analisado.');
            return;
        }
       /* if (!context) {
            showError('Por favor, descreva o contexto do arquivo para uma melhor análise.');
            return;
        }*/

        const formData = new FormData();
        formData.append('analysis_type', 'file');
        formData.append('context', context);
        formData.append('file', file); // O navegador cuida do resto

        await sendRequest(formData);
    }

    // =================================================================
    // 4. FUNÇÃO CENTRAL DE ENVIO DA REQUISIÇÃO
    // =================================================================

    /**
     * Envia os dados para o backend usando FormData.
     * @param {FormData} formData O objeto FormData a ser enviado.
     */
    async function sendRequest(formData) {
        // Para depuração, você pode ver o que está sendo enviado
        // for (let [key, value] of formData.entries()) {
        //     console.log(key, value);
        // }

        const response = await fetch(backendUrl, {
            method: 'POST',
            // IMPORTANTE: Ao usar FormData, NÃO defina o header 'Content-Type'.
            // O navegador faz isso automaticamente, incluindo o 'boundary' necessário.
            body: formData
        });

        if (!response.ok) {
            // Tenta ler o erro do corpo da resposta, se houver
            const errorData = await response.json().catch(() => null);
            const errorMessage = errorData?.detail || `Erro no servidor: ${response.status} ${response.statusText}`;
            throw new Error(errorMessage);
        }

        const data = await response.json();

        if (data.success) {
            displayAnalysis(data.report);
        } else {
            showError(data.report || 'Erro desconhecido na análise');
        }
    }

    // =================================================================
    // 5. FUNÇÕES AUXILIARES (A MAIORIA É REUTILIZADA)
    // =================================================================

    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
    
    function showLoader(show) {
        loader.style.display = show ? 'block' : 'none';
        analyzeBtn.disabled = show;
    }

    function showError(message) {
        resultsDiv.innerHTML = `<div class="error"><p>${message}</p></div>`;
    }

    function displayAnalysis(markdownReport) {
        const htmlContent = marked.parse(markdownReport);
        resultsDiv.innerHTML = `
            <div class="analysis-report">${htmlContent}</div>
            <div class="report-actions">
                <button class="btn btn-primary mt-3" onclick="downloadReport()">Baixar Relatório</button>
            </div>
        `;
        // Funções para realçar o conteúdo podem ser chamadas aqui, se necessário.
    }
    
    // As funções 'downloadReport' e 'shareReport' podem ser mantidas como estão,
    // pois operam no conteúdo já renderizado no 'resultsDiv'.
    window.downloadReport = function() {
        const reportElement = document.querySelector('.analysis-report');
        if (!reportElement) return;

        html2canvas(reportElement, { scale: 2 }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgHeight = canvas.height * pageWidth / canvas.width;
            let heightLeft = imgHeight;
            let yPosition = 0;

            pdf.addImage(imgData, 'PNG', 0, yPosition, pageWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                yPosition -= pageHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, yPosition, pageWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            pdf.save('relatorio-analise.pdf');
        });
    };
});