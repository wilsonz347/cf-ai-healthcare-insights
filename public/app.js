class HealthcareAgentClient {
    constructor() {
        this.currentDataset = null;
        this.websocket = null;
        this.initializeElements();
        this.setupEventListeners();
        this.connectWebSocket();
    }

    initializeElements() {
        this.fileInput = document.getElementById('fileInput');
        this.uploadArea = document.getElementById('uploadArea');
        this.datasetInfo = document.getElementById('datasetInfo');
        this.datasetDetails = document.getElementById('datasetDetails');
        this.chatMessages = document.getElementById('chatMessages');
        this.chatInput = document.getElementById('chatInput');
        this.sendButton = document.getElementById('sendButton');
        this.analysisResults = document.getElementById('analysisResults');
    }

    setupEventListeners() {
        // File upload
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.style.backgroundColor = '#f0f8ff';
        });
        this.uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.uploadArea.style.backgroundColor = '';
        });
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.style.backgroundColor = '';
            this.handleFileUpload(e);
        });

        // Chat
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
    }

    connectWebSocket() {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/websocket`;
        
        this.websocket = new WebSocket(wsUrl);
        
        this.websocket.onopen = () => {
            console.log('WebSocket connected');
        };

        this.websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            this.handleWebSocketMessage(data);
        };

        this.websocket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    async handleFileUpload(event) {
        const files = event.dataTransfer ? event.dataTransfer.files : event.target.files;
        if (!files.length) return;

        const file = files[0];
        if (!file.name.endsWith('.csv')) {
            alert('Please upload a CSV file');
            return;
        }

        try {
            const content = await this.readFileContent(file);
            
            const message = {
                type: 'upload_dataset',
                data: {
                    file: content,
                    name: file.name
                }
            };

            if (this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.send(JSON.stringify(message));
            }

            this.addChatMessage('system', `Uploading ${file.name}...`);

        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error uploading file: ' + error.message);
        }
    }

    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;

        this.addChatMessage('user', message);
        this.chatInput.value = '';

        const wsMessage = {
            type: 'chat_message',
            data: {
                message: message,
                datasetId: this.currentDataset?.id
            }
        };

        if (this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(wsMessage));
        }
    }

    handleWebSocketMessage(data) {
        switch (data.type) {
            case 'dataset_uploaded':
                this.handleDatasetUploaded(data.dataset);
                break;
            case 'chat_response':
                this.handleChatResponse(data);
                break;
            case 'error':
                this.addChatMessage('system', 'Error: ' + data.message);
                break;
        }
    }

    handleDatasetUploaded(dataset) {
        this.currentDataset = dataset;
        this.datasetDetails.textContent = 
            `${dataset.name} - ${dataset.rowCount} rows, ${dataset.columns.length} columns`;
        this.datasetInfo.classList.remove('hidden');
        
        this.chatInput.disabled = false;
        this.sendButton.disabled = false;
        this.chatInput.placeholder = `Ask questions about ${dataset.name}...`;

        this.addChatMessage('system', 
            `Dataset uploaded successfully! You can now ask questions about your ${dataset.rowCount} records.`);
    }

    handleChatResponse(data) {
        this.addChatMessage('assistant', data.message);
        
        if (data.analysis) {
            this.displayAnalysis(data.analysis);
        }
    }

    addChatMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        messageDiv.textContent = content;
        this.chatMessages.appendChild(messageDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    displayAnalysis(analysis) {
        this.analysisResults.innerHTML = `
            <h3>📊 Analysis Results</h3>
            <p><strong>Summary:</strong> ${analysis.summary}</p>
            
            <div class="statistics-grid">
                ${Object.entries(analysis.statistics).map(([key, value]) => `
                    <div class="stat-card">
                        <div class="stat-value">${value.toFixed(2)}</div>
                        <div class="stat-label">${key.replace(/_/g, ' ').toUpperCase()}</div>
                    </div>
                `).join('')}
            </div>
            
            <div>
                <h4>💡 Key Insights:</h4>
                <ul>
                    ${analysis.insights.map(insight => `<li>${insight}</li>`).join('')}
                </ul>
            </div>
        `;
    }
}

// Initialize the client when page loads
document.addEventListener('DOMContentLoaded', () => {
    new HealthcareAgentClient();
});
