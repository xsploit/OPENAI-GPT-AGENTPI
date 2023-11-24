/*
 * Created by David Adams
 * https://codeshack.io/build-ai-powered-chatbot-openai-chatgpt-javascript/
 * 
 * Released under the MIT license
 */
'use strict';
class ChatAI {

    constructor(options) {
        let defaults = {
            api_key: '',
            source: 'openai',
            model: 'gpt-3.5-turbo',
            conversations: [],
            selected_conversation: null,
            container: '.chat-ai',
            chat_speed: 30,
            title: 'Untitled',
            max_tokens: 100,
            version: '1.0.0',
            show_tokens: true,
            available_models: ['gpt-4', 'gpt-4-0613', 'gpt-4-32k', 'gpt-4-32k-0613', 'gpt-3.5-turbo', 'gpt-3.5-turbo-0613', 'gpt-3.5-turbo-16k', 'gpt-3.5-turbo-16k-0613']
        };
        this.options = Object.assign(defaults, options);
        this.options.container = document.querySelector(this.options.container);
        this.options.container.innerHTML = `
            ${this._sidebarTemplate()}
            <main class="content">               
                ${this._welcomePageTemplate()}
                <form class="message-form">
                <div class="left-button-container">
                    <button type="button" id="uploadButton"><i class="fa-solid fa-upload"></i></button>
                    <button type="button" id="speakButton"><i class="fa-solid fa-microphone"></i></button>
                </div>
                <input type="text" placeholder="Type a message..." required>
                <div class="right-button-container">
                    <button type="submit"><i class="fa-solid fa-paper-plane"></i></button>
                </div>
            </form>
            </main>
        `;
        let settings = this.getSettings();
        if (settings) {
            this.options = Object.assign(this.options, settings);
        }
        this._eventHandlers();
        this.container.querySelector('.message-form input').focus();
    }

    async getMessage() {
        let userMessage = this.container.querySelector('.message-form input').value;
        // Do not clear the input field or display the user message here
        // as it's already handled by the form's submit event in _eventHandlers
        
        try {
            const data = await this.sendMessageToAPI(userMessage);
            if (data.message) {
                this.displayMessage(data.message, 'assistant'); // Display the AI's message
            } else {
                this.displayMessage('No response from AI.', 'assistant');
            }
        } catch (error) {
            console.error('Error:', error);
            this.displayMessage('Failed to get a response.', 'assistant');
        }
    }
    
    
    
    async sendMessageToAPI(message) {
        const response = await fetch('http://server:3000/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message })
        });
    
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        return await response.json();
    }
    
    displayMessage(message, role) {
        // Format code blocks
        console.log("Before formatting:", message);
        const formattedMessage = message.replace(/```(.*?)```/gs, "<pre><code>$1</code></pre>");
        console.log("After formatting:", formattedMessage);



        const messagesContainer = this.container.querySelector('.content .messages');
        
        // If it's an assistant message, replace the placeholder in the active message
        if (role === 'assistant') {
            // Find the active assistant message element
            let activeAssistantMessage = messagesContainer.querySelector('.message.assistant.active .text');
            
            // Replace the placeholder with the actual message
            if (activeAssistantMessage) {
                activeAssistantMessage.innerHTML = formattedMessage; // Use formattedMessage here
                // Remove the 'active' class to stop showing the blinking cursor
                activeAssistantMessage.closest('.message.assistant').classList.remove('active');
            } else {
                // If there's no active message, we add a new one
                const newMessageDiv = document.createElement('div');
                newMessageDiv.className = `message ${role}`;
                newMessageDiv.innerHTML = `
                    <div class="wrapper">
                        <div class="avatar">AI</div>
                        <div class="details">
                            <div class="date">${new Date().toLocaleTimeString()}</div>
                            <div class="text">${formattedMessage}</div> <!-- Use formattedMessage here -->
                        </div>
                    </div>
                `;
                messagesContainer.appendChild(newMessageDiv);
            }
        } else {
            // For user messages, we always add a new message div
            const newMessageDiv = document.createElement('div');
            newMessageDiv.className = `message ${role}`;
            newMessageDiv.innerHTML = `
                <div class="wrapper">
                    <div class="avatar"><i class="fa-solid fa-user"></i></div>
                    <div class="details">
                        <div class="date">${new Date().toLocaleTimeString()}</div>
                        <div class="text">${formattedMessage}</div> <!-- Use formattedMessage here -->
                    </div>
                </div>
            `;
            messagesContainer.appendChild(newMessageDiv);
        }
        
        // Scroll to the latest message
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    

    

    async getJsonFile() {
        try {
            let [fileHandle] = await window.showOpenFilePicker();
            let file = await fileHandle.getFile();
            let fileContents = await file.text();
            let jsonObject = JSON.parse(fileContents);
            return { content: jsonObject, name: file.name };
        } catch (error) {
            if (error.code !== DOMException.ABORT_ERR) {
                console.error('Error reading JSON file:', error);
                this.showErrorMessage(error.message);
            }
        }
    }

    async saveJsonToFile(jsonObject) {
        try {
            let options = {
                suggestedName: 'ai-conversations.json',
                types: [{
                    description: 'JSON Files',
                    accept: { 'application/json': ['.json'] }
                }]
            };
            let handle = await window.showSaveFilePicker(options);
            let writable = await handle.createWritable();
            let jsonString = JSON.stringify(jsonObject, null, 2);
            await writable.write(jsonString);
            await writable.close();
            this.options.title = handle.name;
            this.updateTitle(false);
            this.showSuccessMessage('File saved successfully.');
        } catch (error) {
            if (error.code !== DOMException.ABORT_ERR) {
                console.error('Error saving JSON file:', error);
                this.showErrorMessage(error.message);
            }
        }
    }

    showErrorMessage(message) {
        this.container.querySelectorAll('.error').forEach(error => error.remove());
        let error = document.createElement('div');
        error.classList.add('error-toast');
        error.innerHTML = message;
        this.container.appendChild(error);
        error.getBoundingClientRect();
        error.style.transition = 'opacity .5s ease-in-out 4s';
        error.style.opacity = 0;
        setTimeout(() => error.remove(), 5000);
    }

    showSuccessMessage(message) {
        this.container.querySelectorAll('.success').forEach(success => success.remove());
        let success = document.createElement('div');
        success.classList.add('success-toast');
        success.innerHTML = message;
        this.container.appendChild(success);
        success.getBoundingClientRect();
        success.style.transition = 'opacity .5s ease-in-out 4s';
        success.style.opacity = 0;
        setTimeout(() => success.remove(), 5000);
    }

    formatElapsedTime(dateString) {
        let date = new Date(dateString);
        let now = new Date();
        let elapsed = now - date;
        let seconds = Math.floor(elapsed / 1000);
        let minutes = Math.floor(seconds / 60);
        let hours = Math.floor(minutes / 60);
        let days = Math.floor(hours / 24);
        if (days > 1) {
            return `${days} days ago`;
        } else if (days === 1) {
            return 'Yesterday';
        } else if (hours > 0) {
            return `${hours} hours ago`;
        } else if (minutes > 0) {
            return `${minutes} minutes ago`;
        } else {
            return `${seconds} seconds ago`;
        }
    }

    loadConversation(obj) {
        this.clearWelcomeScreen();
        this.clearMessages();
        this.container.querySelector('.content .messages').insertAdjacentHTML('afterbegin', `
            <div class="conversation-title">
                <h2><span class="text">${obj.name}</span><i class="fa-solid fa-pencil edit"></i><i class="fa-solid fa-trash delete"></i></h2>
            </div>
        `);
        this._conversationTitleClickHandler();
        obj.messages.forEach(message => {
            this.container.querySelector('.content .messages').insertAdjacentHTML('afterbegin', `
                <div class="message ${message.role}">
                    <div class="wrapper">
                        <div class="avatar">${message.role == 'assistant' ? 'AI' : '<i class="fa-solid fa-user"></i>'}</div>
                        <div class="details">
                            <div class="date" title="${message.date}">${this.formatElapsedTime(message.date)}</div>
                            <div class="text">
                                ${message.content.replace(/(?:\r\n|\r|\n)/g, '<br>').replace(/```(.*?)```/, "<pre><code>$1" + "<" + "/code>" + "<" + "/pre>")}
                                ${this.options.show_tokens && message.total_tokens ? '<div><span class="tokens">' + message.total_tokens + ' Tokens</span></div>' : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `);
        });
    }

    clearWelcomeScreen() {
        if (this.container.querySelector('.content .welcome')) {
            this.container.querySelector('.content .welcome').remove();
            this.container.querySelector('.content').insertAdjacentHTML('afterbegin', '<div class="messages"></div>');
            return true;
        }
        return false;
    }

    clearMessages() {
        if (this.container.querySelector('.content .messages')) {
            this.container.querySelector('.content .messages').innerHTML = '';
            return true;
        }
        return false;
    }

    createNewConversation(title = null) {  
        title = title != null ? title : 'Conversation ' + (this.conversations.length + 1);
        let index = this.conversations.push({ name: title, messages: [] });
        this.container.querySelectorAll('.conversations .list a').forEach(c => c.classList.remove('selected'));
        this.container.querySelector('.conversations .list').insertAdjacentHTML('beforeend', `<a class="conversation selected" href="#" data-id="${index - 1}" title="${title}"><i class="fa-regular fa-message"></i>${title}</a>`);
        this.clearWelcomeScreen();
        this.clearMessages();
        this._conversationClickHandlers();
        this.container.querySelector('.content .messages').innerHTML = '<div class="conversation-title"><h2><span class="text">' + title + '</span><i class="fa-solid fa-pencil edit"></i><i class="fa-solid fa-trash delete"></i></h2></div>';
        this._conversationTitleClickHandler();
        this.container.querySelector('.message-form input').focus();
        this.updateTitle();
        return index - 1;
    }

    updateTitle(unsaved = true) {
        document.title = unsaved ? '* ' + this.options.title.replace('* ', '') : this.options.title.replace('* ', '');
    }

    modal(options) {
        let element;
        if (document.querySelector(options.element)) {
            element = document.querySelector(options.element);
        } else if (options.modalTemplate) {
            document.body.insertAdjacentHTML('beforeend', options.modalTemplate());
            element = document.body.lastElementChild;
        }
        options.element = element;
        options.open = obj => {
            element.style.display = 'flex';
            element.getBoundingClientRect();
            element.classList.add('open');
            if (options.onOpen) options.onOpen(obj);
        };
        options.close = obj => {
            if (options.onClose) {
                let returnCloseValue = options.onClose(obj);
                if (returnCloseValue !== false) {
                    element.style.display = 'none';
                    element.classList.remove('open');
                    element.remove();
                }
            } else {
                element.style.display = 'none';
                element.classList.remove('open');
                element.remove();
            }
        };
        if (options.state == 'close') {
            options.close({ source: element, button: null });
        } else if (options.state == 'open') {
            options.open({ source: element }); 
        }
        element.querySelectorAll('.modal-close').forEach(e => {
            e.onclick = event => {
                event.preventDefault();
                options.close({ source: element, button: e });
            };
        });
        return options;
    }

    openSettingsModal() {
        let self = this;
        return this.modal({
            state: 'open',
            modalTemplate: function () {
                return `
                <div class="chat-ai-modal">
                    <div class="content">
                        <h3 class="heading">Settings<span class="modal-close">&times;</span></h3>
                        <div class="body">
                            <form class="settings-form" action="">
                                <label for="api_key">API Key</label>
                                <input type="text" name="api_key" id="api_key" value="${self.APIKey}">
                                <label for="source">Source</label>
                                <select name="source" id="source">
                                    <option value="openai" selected>OpenAI</option>
                                </select>
                                <label for="model">Model</label>
                                <select name="model" id="model">
                                    ${self.options.available_models.map(m => `<option value="${m}"${self.model==m?' selected':''}>${m}</option>`).join('')}
                                </select>
                                <label for="max_tokens">Max Tokens</label>
                                <input type="number" name="max_tokens" id="max_tokens" value="${self.maxTokens}">
                                <div class="msg"></div>
                            </form>
                        </div>
                        <div class="footer">
                            <a href="#" class="btn modal-close save">Save</a>
                            <a href="#" class="btn modal-close reset right alt">Reset</a>
                        </div>
                    </div>
                </div>
                `;
            },
            onClose: function (event) {
                if (event && event.button) {
                    if (event.button.classList.contains('save')) {
                        self.APIKey = event.source.querySelector('#api_key').value;
                        self.maxTokens = event.source.querySelector('#max_tokens').value;
                        self.source = event.source.querySelector('#source').value;
                        self.model = event.source.querySelector('#model').value;
                        self.saveSettings();
                    }
                    if (event.button.classList.contains('reset')) {
                        localStorage.removeItem('settings');
                        location.reload();
                    }
                }
            }
        });
    }

    getSettings() {
        return localStorage.getItem('settings') ? JSON.parse(localStorage.getItem('settings')) : false;
    }

    saveSettings() {
        localStorage.setItem('settings', JSON.stringify({ api_key: this.APIKey, max_tokens: this.maxTokens, source: this.source, model: this.model }));
    }

    _welcomePageTemplate() {
        return `
            <div class="welcome">
                <h1>AgentPI<span class="ver">${this.options.version}</span></h1>                    
                <p>AI PI</p>
                <a href="#" class="open-database"><i class="fa-regular fa-folder-open"></i>Open Database...</a>
            </div>
        `;
    }

    _sidebarTemplate() {
        return `
            <a href="#" class="open-sidebar" title="Open Sidebar"><i class="fa-solid fa-bars"></i></a>
            <nav class="conversations">
                <a class="new-conversation" href="#"><i class="fa-solid fa-plus"></i>New Conversation</a>
                <div class="list"></div>
                <div class="footer">
                    <a class="save" href="#" title="Save"><i class="fa-solid fa-floppy-disk"></i></a>
                    <a class="open-database" href="#"><i class="fa-regular fa-folder-open"></i></a>
                    <a class="settings" href="#"><i class="fa-solid fa-cog"></i></a>
                    <a class="close-sidebar" href="#" title="Close Sidebar"><i class="fa-solid fa-bars"></i></a>
                </div>
            </nav>
        `;
    }

    _conversationClickHandlers() {
        this.container.querySelectorAll('.conversations .list a').forEach(conversation => {
            conversation.onclick = event => {
                event.preventDefault();
                this.container.querySelectorAll('.conversations .list a').forEach(c => c.classList.remove('selected'));
                conversation.classList.add('selected');
                this.selectedConversationIndex = conversation.dataset.id;
                this.loadConversation(this.selectedConversation);
                this.container.querySelector('.content .messages').scrollTop = this.container.querySelector('.content .messages').scrollHeight;
            };
        });
    }

    _conversationTitleClickHandler() {
        this.container.querySelector('.conversation-title i.edit').onclick = () => {
            this.container.querySelector('.conversation-title .text').contentEditable = true;
            this.container.querySelector('.conversation-title .text').focus();
            let update = () => {
                this.container.querySelector('.conversation-title .text').contentEditable = false;
                this.selectedConversation.name = this.container.querySelector('.conversation-title .text').innerText;
                this.container.querySelector('.conversation-title .text').blur();
                this.container.querySelector('.conversations .list a[data-id="' + this.selectedConversationIndex + '"]').innerHTML = '<i class="fa-regular fa-message"></i>' + this.selectedConversation.name;
                this.container.querySelector('.conversations .list a[data-id="' + this.selectedConversationIndex + '"]').title = this.selectedConversation.name;
                this.updateTitle();
            };
            this.container.querySelector('.conversation-title .text').onblur = () => update();
            this.container.querySelector('.conversation-title .text').onkeydown = event => {
                if (event.keyCode == 13) {
                    event.preventDefault();
                    update();
                }
            };
        };
        this.container.querySelector('.conversation-title i.delete').onclick = () => {
            if (confirm('Are you sure you want to delete this conversation?')) {
                this.conversations.splice(this.selectedConversationIndex, 1);
                this.selectedConversation = [];
                this.selectedConversationIndex = null;
                this.container.querySelector('.content').innerHTML = '';
                this.container.querySelector('.conversations .list .conversation.selected').remove();
                this.updateTitle();
                if (!this.container.querySelector('.content .welcome')) {
                    this.container.querySelector('.content').insertAdjacentHTML('afterbegin', this._welcomePageTemplate());
                }
                this._openDatabaseEventHandlers();
            }
        };
    }

    _openDatabaseEventHandlers() {
        this.container.querySelectorAll('.open-database').forEach(button => {
            button.onclick = event => {
                event.preventDefault();
                if (document.title.startsWith('*') && !confirm('You have unsaved changes. Continue without saving?')) {
                    return;
                }
                this.getJsonFile().then(json => {
                    if (json !== undefined) {
                        if (this.container.querySelector('.content .messages')) {
                            this.container.querySelector('.content .messages').remove();
                        }
                        if (!this.container.querySelector('.content .welcome')) {
                            this.container.querySelector('.content').insertAdjacentHTML('afterbegin', this._welcomePageTemplate());
                        }
                        this.container.querySelector('.conversations .list').innerHTML = '';
                        this.selectedConversation = [];
                        this.selectedConversationIndex = null;
                        this.conversations = json.content;
                        document.title = json.name;
                        this.options.title = json.name;
                        this.conversations.forEach((conversation, index) => {
                            this.container.querySelector('.conversations .list').insertAdjacentHTML('beforeend', `<a class="conversation" href="#" data-id="${index}" title="${conversation.name}"><i class="fa-regular fa-message"></i>${conversation.name}</a>`);
                        });
                        this._conversationClickHandlers();
                        this._openDatabaseEventHandlers();
                    }
                });
            };
        });
    }

    _eventHandlers() {
        this.container.querySelector('.message-form').onsubmit = event => {
            event.preventDefault();
            this.clearWelcomeScreen();
            if (this.selectedConversation === undefined) {
                this.selectedConversationIndex = this.createNewConversation();
            }
            let date = new Date();
            this.selectedConversation.messages.push({
                role: 'user',
                content: this.container.querySelector('.message-form input').value,
                date: date
            });
            this.container.querySelector('.messages').insertAdjacentHTML('afterbegin', `
                <div class="message assistant active">
                    <div class="wrapper">
                        <div class="avatar">AI</div>
                        <div class="details">
                            <div class="date" data-date="${date}" title="${date}">just now</div>
                            <div class="text"><span class="blink">_</span></div>
                        </div>
                    </div>
                </div>
                <div class="message user">
                    <div class="wrapper">
                        <div class="avatar"><i class="fa-solid fa-user"></i></div>
                        <div class="details">
                            <div class="date" data-date="${date}" title="${date}">just now</div>
                            <div class="text">${this.container.querySelector('.message-form input').value}</div>
                        </div>
                    </div>
                </div>
            `);
           
            this.getMessage(this.container.querySelector('.message-form input').value);
            this.container.querySelector('.message-form input').value = '';
            this.updateTitle();
        };
        window.addEventListener('keydown', event => {
            if (event.ctrlKey && event.key === 's') {
                event.preventDefault();
                this.saveJsonToFile(this.conversations);
            }
        });
/*         window.addEventListener('beforeunload', event => {
            if (document.title.startsWith('*') && !confirm('You have unsaved changes. Are you sure you want to leave?')) {
                event.preventDefault();
                event.returnValue = '';
            }
        }); */
        this.container.querySelector('.save').onclick = event => {
            event.preventDefault();
            this.saveJsonToFile(this.conversations);
        };
        this.container.querySelector('.conversations .new-conversation').onclick = event => {
            event.preventDefault();
            this.selectedConversationIndex = this.createNewConversation();
        };
        this.container.querySelector('.open-sidebar').onclick = event => {
            event.preventDefault();
            this.container.querySelector('.conversations').style.display = 'flex';
            this.container.querySelector('.open-sidebar').style.display = 'none';
            localStorage.setItem('sidebar', 'open');
        };
        this.container.querySelector('.close-sidebar').onclick = event => {
            event.preventDefault();
            this.container.querySelector('.conversations').style.display = 'none';
            this.container.querySelector('.open-sidebar').style.display = 'flex';
            localStorage.setItem('sidebar', 'closed');
        };
        if (localStorage.getItem('sidebar') === 'closed') {
            this.container.querySelector('.conversations').style.display = 'none';
            this.container.querySelector('.open-sidebar').style.display = 'flex';
        }
        this.container.querySelector('.settings').onclick = event => {
            event.preventDefault();
            this.openSettingsModal();
        };
        setInterval(() => {
            this.container.querySelectorAll('[data-date]').forEach(element => {
                element.innerHTML = this.formatElapsedTime(element.getAttribute('data-date'));
            });
        }, 120000);
        this._openDatabaseEventHandlers();
        this._conversationClickHandlers();
    }


    get APIKey() {
        return this.options.api_key;
    }

    set APIKey(value) {
        this.options.api_key = value;
    }

    get model() {
        return this.options.model;
    }

    set model(value) {
        this.options.model = value;
    }

    get source() {
        return this.options.source;
    }

    set source(value) {
        this.options.source = value;
    }

    get conversations() {
        return this.options.conversations;
    }

    set conversations(value) {
        this.options.conversations = value;
    }

    get selectedConversationIndex() {
        return this.options.selected_conversation;
    }

    set selectedConversationIndex(value) {
        this.options.selected_conversation = value;
    }

    get selectedConversation() {
        return this.conversations[this.selectedConversationIndex];
    }

    set selectedConversation(value) {
        this.conversations[this.selectedConversationIndex] = value;
    } 
    
    get container() {
        return this.options.container;
    }

    set container(value) {
        this.options.container = value;
    }

    get maxTokens() {
        return parseInt(this.options.max_tokens);
    }

    set maxTokens(value) {
        this.options.max_tokens = parseInt(value);
    }

}
new ChatAI({
    container: '.chat-ai',
    api_key: 'YOUR_API_KEY',
    model: 'gpt-3.5-turbo'
});