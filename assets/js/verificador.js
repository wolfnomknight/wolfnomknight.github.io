document.addEventListener('DOMContentLoaded', () => {
    // Elementos da página
    const analyzeBtn = document.getElementById('analyze-btn');
    const urlInput = document.getElementById('news-url');
    const loader = document.getElementById('loader');
    const resultsDiv = document.getElementById('results');
    
    // Evento de clique no botão
    analyzeBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        
        // Validação básica da URL
        if (!isValidUrl(url)) {
            alert('Por favor, insira uma URL válida de notícia');
            return;
        }
        
        // Mostrar loader e resetar resultados
        showLoader(true);
        resultsDiv.innerHTML = '';
        
        try {
            // Chamar a API do backend
            const response = await fetch('https://news-verifier-163762341148.southamerica-east1.run.app/analyze', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ url: url })
            });
            
            const data = await response.json();
            
            if (data.success) {
                displayAnalysis(data.report);
            } else {
                showError(data.error || 'Erro desconhecido na análise');
            }
            
        } catch (error) {
            showError('Falha na comunicação com o servidor: ' + error.message);
        } finally {
            showLoader(false);
        }
    });
    
    // Funções auxiliares
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
        resultsDiv.innerHTML = `
            <div class="error">
                <h3>Erro na Análise</h3>
                <p>${message}</p>
                <p>Tente novamente ou contate o suporte.</p>
            </div>
        `;
    }
    
    function displayAnalysis(markdownReport) {
        // Converter Markdown para HTML
        const htmlContent = marked.parse(markdownReport);
        
        // Criar contêiner para o relatório
        resultsDiv.innerHTML = `
            <div class="analysis-report">
                ${htmlContent}
            </div>
            
            <div class="report-actions">
                <button class="btn-download" onclick="downloadReport()">
                    <i class="icon-download"></i> Baixar Relatório
                </button>
                <button class="btn-share" onclick="shareReport()">
                    <i class="icon-share"></i> Compartilhar
                </button>
            </div>
        `;
        
        // Adicionar realces especiais
        highlightKeyElements();
    }
    
    function highlightKeyElements() {
        // Realçar pontuação de veracidade
        const veracityScores = document.querySelectorAll('.analysis-report strong');
        veracityScores.forEach(el => {
            if (el.textContent.includes('%')) {
                el.classList.add('veracity-score');
                
                // Adicionar cor baseada na pontuação
                const score = parseInt(el.textContent);
                if (score >= 80) el.classList.add('high-score');
                else if (score >= 60) el.classList.add('medium-score');
                else el.classList.add('low-score');
            }
        });
        
        // Adicionar ícones às seções
        const sections = document.querySelectorAll('.analysis-report h2');
        sections.forEach(section => {
            if (section.textContent.includes('Falácias')) {
                section.innerHTML = '🔍 ' + section.innerHTML;
            }
            if (section.textContent.includes('Resumo')) {
                section.innerHTML = '📝 ' + section.innerHTML;
            }
            if (section.textContent.includes('Fontes')) {
                section.innerHTML = '📚 ' + section.innerHTML;
            }
        });
    }
    
    // Função para baixar relatório em PDF
    window.downloadReport = function() {
        const reportElement = document.querySelector('.analysis-report');
        
        html2canvas(reportElement, { scale: 2 }).then(canvas => {
            // 1. OBTER DIMENSÕES
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jspdf.jsPDF({
                orientation: 'p', // portrait
                unit: 'mm',       // millimeters
                format: 'a4'
            });
    
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            
            // Calcula a altura da imagem no PDF mantendo a proporção
            const imgHeight = canvas.height * pageWidth / canvas.width;
    
            // 2. LÓGICA DE MÚLTIPLAS PÁGINAS
            let heightLeft = imgHeight; // Altura da imagem que ainda falta ser adicionada ao PDF
            let yPosition = 0;          // Posição Y inicial na imagem para começar a "fatiar"
    
            // Adiciona a primeira página
            pdf.addImage(imgData, 'PNG', 0, yPosition, pageWidth, imgHeight);
            heightLeft -= pageHeight;
    
            // Enquanto houver conteúdo da imagem para adicionar, cria novas páginas
            while (heightLeft > 0) {
                yPosition -= pageHeight; // Move a posição de "fatiamento" para cima na imagem
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, yPosition, pageWidth, imgHeight);
                heightLeft -= pageHeight;
            }
            
            // 3. SALVAR O PDF
            pdf.save('analise-de-credibilidade.pdf');
        });
    };
    
    // Função para compartilhar análise
    window.shareReport = function() {
        if (navigator.share) {
            navigator.share({
                title: 'Análise de Credibilidade',
                text: 'Confira esta análise de notícia gerada por IA',
                url: window.location.href
            }).catch(error => console.log('Erro ao compartilhar:', error));
        } else {
            // Fallback para copiar link
            navigator.clipboard.writeText(window.location.href);
            alert('Link copiado para a área de transferência!');
        }
    };
});