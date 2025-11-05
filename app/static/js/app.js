// Global state
let currentSlides = [];
let selectedSlideIndex = 0;
let sortableInstance = null;
let rawSummaryText = '';
let isConfigured = false;

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    console.log('=== DOMContentLoaded fired ===');
    
    // Force hide loading indicator immediately
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.style.display = 'none';
        console.log('Loading indicator hidden');
    }
    
    console.log('Initializing event listeners...');
    initializeEventListeners();
    
    console.log('Initializing markdown toolbar...');
    initializeMarkdownToolbar();
    
    console.log('Checking settings...');
    await checkSettings();
    
    console.log('=== App initialization complete ===');
});

// Check if API settings are configured
async function checkSettings() {
    console.log('checkSettings() started');
    
    try {
        console.log('Fetching /api/config/status...');
        const response = await fetch('/api/config/status');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            throw new Error('Failed to fetch config status');
        }
        
        const data = await response.json();
        console.log('Config status:', data);
        
        isConfigured = data.configured;
        console.log('isConfigured:', isConfigured);
        
        if (!isConfigured) {
            console.log('=== API NOT CONFIGURED ===');
            disableMainFeatures();
            // Show modal immediately
            showSettingsModal();
        } else {
            console.log('=== API CONFIGURED ===');
            enableMainFeatures();
            await loadModels();
        }
    } catch (error) {
        console.error('Error in checkSettings():', error);
        isConfigured = false;
        disableMainFeatures();
        showSettingsModal();
    }
    
    console.log('checkSettings() completed');
}

// Show settings modal
function showSettingsModal() {
    console.log('=== showSettingsModal() START ===');
    const modal = document.getElementById('settings-modal');
    console.log('Modal element:', modal);
    
    if (!modal) {
        console.error('!!! CRITICAL: Settings modal element NOT FOUND !!!');
        console.log('Searching for modal-related elements...');
        const allElements = document.querySelectorAll('[id*="modal"], [id*="settings"]');
        console.log('Found elements:', allElements);
        allElements.forEach(el => {
            console.log('  - ID:', el.id, 'Tag:', el.tagName, 'Classes:', el.className);
        });
        return;
    }
    
    // Remove any hidden class or attribute
    modal.classList.remove('hidden');
    modal.removeAttribute('hidden');
    
    // Force display with inline styles
    modal.style.display = 'flex';
    modal.style.position = 'fixed';
    modal.style.zIndex = '999999';
    modal.style.left = '0';
    modal.style.top = '0';
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    
    console.log('Modal display:', modal.style.display);
    console.log('Modal z-index:', modal.style.zIndex);
    
    // Ensure modal content is visible
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.display = 'block';
        modalContent.style.position = 'relative';
        modalContent.style.zIndex = '1000000';
        console.log('Modal content styled');
    } else {
        console.error('Modal content (.modal-content) not found!');
    }
    
    // Focus on first input
    setTimeout(() => {
        const apiKeyInput = document.getElementById('api-key');
        if (apiKeyInput) {
            apiKeyInput.focus();
            console.log('Focused on API key input');
        } else {
            console.error('API key input not found!');
        }
    }, 100);
    
    console.log('=== showSettingsModal() END ===');
}

// Hide settings modal
function hideSettingsModal() {
    console.log('hideSettingsModal() called');
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.style.display = 'none';
        console.log('Modal hidden');
    }
}

// Disable main features when not configured
function disableMainFeatures() {
    console.log('disableMainFeatures() called');
    const elements = [
        'source-text',
        'additional-instructions',
        'source-language',
        'target-language',
        'num-slides',
        'ai-model',
        'translate-summarize-btn',
        'clear-all-btn',
        'send-to-pptx-btn',
        'add-slide-btn',
        'delete-slide-btn',
        'generate-pptx-btn',
        'slide-content'
    ];
    
    let disabledCount = 0;
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.disabled = true;
            disabledCount++;
        }
    });
    
    console.log(`Disabled ${disabledCount} elements`);
    
    // Disable toolbar buttons
    const toolbarButtons = document.querySelectorAll('.toolbar-btn');
    toolbarButtons.forEach(btn => {
        btn.disabled = true;
    });
    console.log(`Disabled ${toolbarButtons.length} toolbar buttons`);
}

// Enable main features when configured
function enableMainFeatures() {
    console.log('enableMainFeatures() called');
    const elements = [
        'source-text',
        'additional-instructions',
        'source-language',
        'target-language',
        'num-slides',
        'ai-model',
        'translate-summarize-btn',
        'clear-all-btn',
        'send-to-pptx-btn',
        'add-slide-btn',
        'delete-slide-btn',
        'generate-pptx-btn',
        'slide-content'
    ];
    
    let enabledCount = 0;
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.disabled = false;
            enabledCount++;
        }
    });
    
    console.log(`Enabled ${enabledCount} elements`);
    
    // Enable toolbar buttons
    const toolbarButtons = document.querySelectorAll('.toolbar-btn');
    toolbarButtons.forEach(btn => {
        btn.disabled = false;
    });
    console.log(`Enabled ${toolbarButtons.length} toolbar buttons`);
}

// Load available AI models
async function loadModels() {
    console.log('loadModels() called');
    try {
        showLoading(true);
        console.log('Fetching /api/models...');
        const response = await fetch('/api/models');
        console.log('Models response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Models error:', errorData);
            throw new Error(errorData.detail || 'Failed to load models');
        }
        
        const data = await response.json();
        console.log('Models loaded:', data);
        
        const modelSelect = document.getElementById('ai-model');
        if (!modelSelect) {
            console.error('Model select not found');
            return;
        }
        
        modelSelect.innerHTML = '';
        
        if (data.models && data.models.length > 0) {
            data.models.forEach(model => {
                const option = document.createElement('option');
                option.value = model.id;
                option.textContent = model.name;
                option.title = model.original_name;
                modelSelect.appendChild(option);
            });
            
            if (data.models.length > 0) {
                modelSelect.value = data.models[0].id;
            }
            
            showNotification(`Loaded ${data.count} AI models`, 'success');
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No models available';
            option.disabled = true;
            modelSelect.appendChild(option);
            showNotification('No models available', 'warning');
        }
    } catch (error) {
        console.error('Error loading models:', error);
        showNotification('Failed to load AI models.', 'error');
        
        const modelSelect = document.getElementById('ai-model');
        if (modelSelect) {
            modelSelect.innerHTML = '<option value="">Error loading models</option>';
        }
    } finally {
        showLoading(false);
    }
}

// Initialize markdown toolbar
function initializeMarkdownToolbar() {
    const toolbar = document.querySelector('.markdown-toolbar');
    if (!toolbar) {
        console.log('Markdown toolbar not found');
        return;
    }
    
    const buttons = toolbar.querySelectorAll('.toolbar-btn');
    console.log(`Found ${buttons.length} toolbar buttons`);
    
    buttons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const action = button.dataset.action;
            console.log(`Toolbar button clicked: ${action}`);
            applyMarkdownFormat(action);
        });
    });
}

// Apply markdown formatting
function applyMarkdownFormat(action) {
    const textarea = document.getElementById('slide-content');
    if (!textarea) {
        console.error('Textarea not found');
        return;
    }
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    const beforeText = textarea.value.substring(0, start);
    const afterText = textarea.value.substring(end);
    
    let newText = '';
    let newCursorPos = start;
    
    const lineStart = beforeText.lastIndexOf('\n') + 1;
    const isLineStart = start === lineStart || beforeText.substring(lineStart, start).trim() === '';
    
    switch (action) {
        case 'h1':
            if (isLineStart && selectedText) {
                newText = `# ${selectedText}`;
                newCursorPos = start + newText.length;
            } else if (isLineStart) {
                newText = '# ';
                newCursorPos = start + 2;
            } else {
                const lineContent = beforeText.substring(lineStart);
                textarea.value = beforeText.substring(0, lineStart) + '# ' + lineContent + selectedText + afterText;
                newCursorPos = lineStart + 2 + lineContent.length + selectedText.length;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
                textarea.focus();
                textarea.dispatchEvent(new Event('input'));
                return;
            }
            break;
            
        case 'h2':
            if (isLineStart && selectedText) {
                newText = `## ${selectedText}`;
                newCursorPos = start + newText.length;
            } else if (isLineStart) {
                newText = '## ';
                newCursorPos = start + 3;
            } else {
                const lineContent = beforeText.substring(lineStart);
                textarea.value = beforeText.substring(0, lineStart) + '## ' + lineContent + selectedText + afterText;
                newCursorPos = lineStart + 3 + lineContent.length + selectedText.length;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
                textarea.focus();
                textarea.dispatchEvent(new Event('input'));
                return;
            }
            break;
            
        case 'h3':
            if (isLineStart && selectedText) {
                newText = `### ${selectedText}`;
                newCursorPos = start + newText.length;
            } else if (isLineStart) {
                newText = '### ';
                newCursorPos = start + 4;
            } else {
                const lineContent = beforeText.substring(lineStart);
                textarea.value = beforeText.substring(0, lineStart) + '### ' + lineContent + selectedText + afterText;
                newCursorPos = lineStart + 4 + lineContent.length + selectedText.length;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
                textarea.focus();
                textarea.dispatchEvent(new Event('input'));
                return;
            }
            break;

        case 'h4':
            if (isLineStart && selectedText) {
                newText = `#### ${selectedText}`;
                newCursorPos = start + newText.length;
            } else if (isLineStart) {
                newText = '#### ';
                newCursorPos = start + 5;
            } else {
                const lineContent = beforeText.substring(lineStart);
                textarea.value = beforeText.substring(0, lineStart) + '#### ' + lineContent + selectedText + afterText;
                newCursorPos = lineStart + 5 + lineContent.length + selectedText.length;
                textarea.setSelectionRange(newCursorPos, newCursorPos);
                textarea.focus();
                textarea.dispatchEvent(new Event('input'));
                return;
            }
            break;
            
        case 'bold':
            if (selectedText) {
                newText = `**${selectedText}**`;
                newCursorPos = start + newText.length;
            } else {
                newText = '****';
                newCursorPos = start + 2;
            }
            break;
            
        case 'italic':
            if (selectedText) {
                newText = `*${selectedText}*`;
                newCursorPos = start + newText.length;
            } else {
                newText = '**';
                newCursorPos = start + 1;
            }
            break;
            
        case 'underline':
            if (selectedText) {
                newText = `<u>${selectedText}</u>`;
                newCursorPos = start + newText.length;
            } else {
                newText = '<u></u>';
                newCursorPos = start + 3;
            }
            break;
            
        case 'strikethrough':
            if (selectedText) {
                newText = `~~${selectedText}~~`;
                newCursorPos = start + newText.length;
            } else {
                newText = '~~~~';
                newCursorPos = start + 2;
            }
            break;
            
        case 'ul':
            if (selectedText) {
                const lines = selectedText.split('\n');
                newText = lines.map(line => line.trim() ? `- ${line}` : line).join('\n');
                newCursorPos = start + newText.length;
            } else {
                if (isLineStart) {
                    newText = '- ';
                    newCursorPos = start + 2;
                } else {
                    textarea.value = beforeText + '\n- ' + afterText;
                    newCursorPos = start + 3;
                    textarea.setSelectionRange(newCursorPos, newCursorPos);
                    textarea.focus();
                    textarea.dispatchEvent(new Event('input'));
                    return;
                }
            }
            break;
            
        case 'ol':
            if (selectedText) {
                const lines = selectedText.split('\n');
                newText = lines.map((line, i) => line.trim() ? `${i + 1}. ${line}` : line).join('\n');
                newCursorPos = start + newText.length;
            } else {
                if (isLineStart) {
                    newText = '1. ';
                    newCursorPos = start + 3;
                } else {
                    textarea.value = beforeText + '\n1. ' + afterText;
                    newCursorPos = start + 4;
                    textarea.setSelectionRange(newCursorPos, newCursorPos);
                    textarea.focus();
                    textarea.dispatchEvent(new Event('input'));
                    return;
                }
            }
            break;
            
        default:
            console.warn(`Unknown action: ${action}`);
            return;
    }
    
    textarea.value = beforeText + newText + afterText;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    textarea.focus();
    textarea.dispatchEvent(new Event('input'));
}

// Initialize event listeners
function initializeEventListeners() {
    console.log('initializeEventListeners() started');
    
    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    console.log('Settings button found:', settingsBtn !== null);
    if (settingsBtn) {
        settingsBtn.addEventListener('click', (e) => {
            console.log('Settings button clicked');
            e.preventDefault();
            showSettingsModal();
        });
    }
    
    // Cancel settings button
    const cancelSettingsBtn = document.getElementById('cancel-settings');
    if (cancelSettingsBtn) {
        cancelSettingsBtn.addEventListener('click', (e) => {
            console.log('Cancel button clicked');
            e.preventDefault();
            if (isConfigured) {
                hideSettingsModal();
            } else {
                showNotification('Please configure API settings to use the app', 'warning');
            }
        });
    }
    
    // Translate & Summarize button
    const translateBtn = document.getElementById('translate-summarize-btn');
    if (translateBtn) {
        translateBtn.addEventListener('click', (e) => {
            console.log('Translate button clicked');
            e.preventDefault();
            handleTranslateAndSummarize();
        });
    }
    
    // Clear All button
    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleClearAll();
        });
    }
    
    // Send to PPTX button
    const sendToPptxBtn = document.getElementById('send-to-pptx-btn');
    if (sendToPptxBtn) {
        sendToPptxBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleSendToPPTX();
        });
    }
    
    // Add Slide button
    const addSlideBtn = document.getElementById('add-slide-btn');
    if (addSlideBtn) {
        addSlideBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleAddSlide();
        });
    }
    
    // Delete Slide button
    const deleteSlideBtn = document.getElementById('delete-slide-btn');
    if (deleteSlideBtn) {
        deleteSlideBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleDeleteSlide();
        });
    }
    
    // Generate PPTX button
    const generatePptxBtn = document.getElementById('generate-pptx-btn');
    if (generatePptxBtn) {
        generatePptxBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleGeneratePPTX();
        });
    }
    
    // Settings form
    const settingsForm = document.getElementById('settings-form');
    console.log('Settings form found:', settingsForm !== null);
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            console.log('Settings form submitted');
            handleSettingsSubmit(e);
        });
    }
    
    // Slide content input
    const slideContentInput = document.getElementById('slide-content');
    if (slideContentInput) {
        slideContentInput.addEventListener('input', (e) => {
            if (currentSlides[selectedSlideIndex]) {
                currentSlides[selectedSlideIndex].content = e.target.value;
                displaySlidesPreviews();
                updateLargePreview();
            }
        });
    }
    
    console.log('initializeEventListeners() completed');
}

// Handle settings form submission
async function handleSettingsSubmit(event) {
    event.preventDefault();
    console.log('=== handleSettingsSubmit() START ===');
    
    const apiKey = document.getElementById('api-key').value.trim();
    const apiUrl = document.getElementById('api-url').value.trim();
    
    console.log('API Key length:', apiKey.length);
    console.log('API URL:', apiUrl);
    
    if (!apiKey || !apiUrl) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        console.log('Posting to /api/config...');
        const response = await fetch('/api/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                api_key: apiKey,
                api_url: apiUrl
            })
        });
        
        console.log('Config response status:', response.status);
        const data = await response.json();
        console.log('Config response data:', data);
        
        if (response.ok) {
            showNotification('Settings saved successfully!', 'success');
            
            // Clear form
            document.getElementById('api-key').value = '';
            document.getElementById('api-url').value = '';
            
            // Wait a moment for backend to update
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Re-check configuration status
            console.log('Re-checking configuration status...');
            const statusResponse = await fetch('/api/config/status');
            const statusData = await statusResponse.json();
            console.log('Updated config status:', statusData);
            
            isConfigured = statusData.configured;
            
            if (isConfigured) {
                hideSettingsModal();
                enableMainFeatures();
                await loadModels();
            } else {
                console.error('Configuration check failed after save');
                showNotification('Configuration saved but verification failed. Please refresh the page.', 'warning');
            }
        } else {
            showNotification(data.detail || 'Failed to save settings', 'error');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showNotification('Failed to save settings. Please try again.', 'error');
    } finally {
        showLoading(false);
    }
    
    console.log('=== handleSettingsSubmit() END ===');
}

// Handle clear button
function handleClearAll() {
    console.log('handleClearAll() called');
    document.getElementById('source-text').value = '';
    document.getElementById('additional-instructions').value = '';
    document.getElementById('source-language').value = 'English';
    document.getElementById('target-language').value = 'Japanese';
    document.getElementById('num-slides').value = '3';
    
    const translatedText = document.getElementById('translated-text');
    if (translatedText) {
        translatedText.value = '';
    }
    
    rawSummaryText = '';
    const summaryDisplay = document.getElementById('summary-display');
    if (summaryDisplay) {
        summaryDisplay.innerHTML = '<p class="placeholder-text">Summary will appear here...</p>';
    }
    
    showNotification('Input, translation, and summary cleared', 'info');
}

// Handle translate and summarize
async function handleTranslateAndSummarize() {
    console.log('=== handleTranslateAndSummarize() called ===');
    
    if (!isConfigured) {
        console.log('Not configured, showing modal');
        showSettingsModal();
        showNotification('Please configure API settings first', 'error');
        return;
    }
    
    const sourceText = document.getElementById('source-text').value.trim();
    const sourceLang = document.getElementById('source-language').value;
    const targetLang = document.getElementById('target-language').value;
    const additionalInstructions = document.getElementById('additional-instructions').value.trim();
    const numSlides = parseInt(document.getElementById('num-slides').value) || 1;
    const model = document.getElementById('ai-model').value;
    
    if (!sourceText) {
        showNotification('Please enter source text', 'error');
        return;
    }
    
    if (!model) {
        showNotification('Please select an AI model', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: sourceText,
                source_lang: sourceLang,
                target_lang: targetLang,
                additional_instructions: additionalInstructions,
                num_slides: numSlides,
                model: model
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Translation failed');
        }
        
        const data = await response.json();
        
        const translatedText = document.getElementById('translated-text');
        if (translatedText) {
            translatedText.value = data.translation;
        }
        
        rawSummaryText = data.summary;
        displaySummaryAsMarkdown(data.summary, numSlides);
        
        showNotification('Translation and summarization completed!', 'success');
    } catch (error) {
        console.error('Error:', error);
        showNotification(error.message || 'An error occurred', 'error');
    } finally {
        showLoading(false);
    }
}

// Display summary as markdown
function displaySummaryAsMarkdown(summaryText, numSlides) {
    const summaryDisplay = document.getElementById('summary-display');
    if (!summaryDisplay) return;
    
    if (!summaryText) {
        summaryDisplay.innerHTML = '<p class="placeholder-text">Summary will appear here...</p>';
        return;
    }
    
    let processedSummary = summaryText;
    if (numSlides > 1) {
        const sections = summaryText.split(/\n(?:---+|___+|\*\*\*+)\n/);
        if (sections.length < numSlides) {
            const lines = summaryText.split('\n');
            const linesPerSlide = Math.ceil(lines.length / numSlides);
            const newSections = [];
            
            for (let i = 0; i < numSlides; i++) {
                const start = i * linesPerSlide;
                const end = Math.min((i + 1) * linesPerSlide, lines.length);
                newSections.push(lines.slice(start, end).join('\n'));
            }
            
            processedSummary = newSections.join('\n\n---\n\n');
        } else {
            processedSummary = sections.join('\n\n---\n\n');
        }
    }
    
    if (typeof marked !== 'undefined') {
        summaryDisplay.innerHTML = marked.parse(processedSummary);
    } else {
        summaryDisplay.innerHTML = `<pre>${processedSummary}</pre>`;
    }
}

// Handle send to PPTX
function handleSendToPPTX() {
    console.log('handleSendToPPTX() called');
    
    if (!rawSummaryText) {
        showNotification('No summary to send', 'error');
        return;
    }
    
    const numSlides = parseInt(document.getElementById('num-slides').value) || 1;
    const newSlides = parseMarkdownToSlides(rawSummaryText, numSlides);
    
    newSlides.forEach((slide, index) => {
        slide.order = currentSlides.length + index;
        currentSlides.push(slide);
    });
    
    displaySlidesPreviews();
    
    if (newSlides.length > 0) {
        selectSlide(currentSlides.length - newSlides.length);
    }
    
    showNotification(`Added ${newSlides.length} slide(s)`, 'success');
}

// Parse markdown to slides
function parseMarkdownToSlides(markdown, numSlides) {
    const slides = [];
    let sections = markdown.split(/\n(?:---+|___+|\*\*\*+)\n/);
    
    if (sections.length < numSlides) {
        const lines = markdown.split('\n');
        const linesPerSlide = Math.ceil(lines.length / numSlides);
        sections = [];
        
        for (let i = 0; i < numSlides; i++) {
            const start = i * linesPerSlide;
            const end = Math.min((i + 1) * linesPerSlide, lines.length);
            sections.push(lines.slice(start, end).join('\n'));
        }
    }
    
    sections.forEach((section, index) => {
        const trimmedSection = section.trim();
        if (trimmedSection) {
            slides.push({
                id: `slide-${Date.now()}-${index}`,
                content: trimmedSection,
                order: index
            });
        }
    });
    
    return slides;
}

// Display slides previews
function displaySlidesPreviews() {
    const container = document.getElementById('slides-preview');
    if (!container) return;
    
    container.innerHTML = '';
    
    currentSlides.forEach((slide, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'slide-preview-wrapper';
        wrapper.dataset.slideId = slide.id;
        
        const numberDiv = document.createElement('div');
        numberDiv.className = 'slide-preview-number';
        numberDiv.textContent = index + 1;
        
        const slideElement = document.createElement('div');
        slideElement.className = 'slide-preview';
        if (index === selectedSlideIndex) {
            slideElement.classList.add('selected');
        }
        slideElement.dataset.index = index;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'slide-preview-content';
        
        if (typeof marked !== 'undefined') {
            contentDiv.innerHTML = marked.parse(slide.content);
        } else {
            contentDiv.textContent = slide.content;
        }
        
        slideElement.appendChild(contentDiv);
        slideElement.addEventListener('click', () => selectSlide(index));
        
        wrapper.appendChild(numberDiv);
        wrapper.appendChild(slideElement);
        container.appendChild(wrapper);
    });
    
    initializeSortable();
}

// Initialize Sortable.js
function initializeSortable() {
    const container = document.getElementById('slides-preview');
    if (!container) return;
    
    if (sortableInstance) {
        sortableInstance.destroy();
    }
    
    if (typeof Sortable !== 'undefined') {
        sortableInstance = new Sortable(container, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            handle: '.slide-preview',
            onEnd: function(evt) {
                const oldIndex = evt.oldIndex;
                const newIndex = evt.newIndex;
                
                if (oldIndex !== newIndex) {
                    const movedSlide = currentSlides.splice(oldIndex, 1)[0];
                    currentSlides.splice(newIndex, 0, movedSlide);
                    
                    currentSlides.forEach((slide, index) => {
                        slide.order = index;
                    });
                    
                    if (selectedSlideIndex === oldIndex) {
                        selectedSlideIndex = newIndex;
                    } else if (selectedSlideIndex > oldIndex && selectedSlideIndex <= newIndex) {
                        selectedSlideIndex--;
                    } else if (selectedSlideIndex < oldIndex && selectedSlideIndex >= newIndex) {
                        selectedSlideIndex++;
                    }
                    
                    displaySlidesPreviews();
                    selectSlide(selectedSlideIndex);
                    
                    showNotification('Slide order updated', 'success');
                }
            }
        });
    }
}

// Select slide
function selectSlide(index) {
    selectedSlideIndex = index;
    
    document.querySelectorAll('.slide-preview').forEach((el, i) => {
        if (i === index) {
            el.classList.add('selected');
        } else {
            el.classList.remove('selected');
        }
    });
    
    const slide = currentSlides[index];
    const slideContent = document.getElementById('slide-content');
    if (slideContent && slide) {
        slideContent.value = slide.content;
    }
    updateLargePreview();
}

// Handle add slide
function handleAddSlide() {
    console.log('handleAddSlide() called');
    const newSlide = {
        id: `slide-${Date.now()}`,
        content: `# New Slide\n\nEnter content here...`,
        order: currentSlides.length
    };
    
    currentSlides.push(newSlide);
    displaySlidesPreviews();
    selectSlide(currentSlides.length - 1);
    
    showNotification('New slide added', 'success');
}

// Handle delete slide
function handleDeleteSlide() {
    console.log('handleDeleteSlide() called');
    
    if (currentSlides.length === 0) {
        showNotification('No slides to delete', 'error');
        return;
    }
    
    currentSlides.splice(selectedSlideIndex, 1);
    
    currentSlides.forEach((slide, index) => {
        slide.order = index;
    });
    
    displaySlidesPreviews();
    
    if (currentSlides.length > 0) {
        const newIndex = Math.max(0, Math.min(selectedSlideIndex, currentSlides.length - 1));
        selectSlide(newIndex);
    } else {
        const slideContent = document.getElementById('slide-content');
        if (slideContent) {
            slideContent.value = '';
        }
        selectedSlideIndex = 0;
        updateLargePreview();
    }
    
    showNotification('Slide deleted', 'success');
}

// Handle generate PPTX
async function handleGeneratePPTX() {
    console.log('=== handleGeneratePPTX() called ===');
    
    if (currentSlides.length === 0) {
        showNotification('No slides to generate', 'error');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/pptx/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                slides: currentSlides
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to generate PPTX');
        }
        
        const data = await response.json();
        window.location.href = data.download_url;
        
        showNotification('PPTX generated successfully!', 'success');
    } catch (error) {
        console.error('Error generating PPTX:', error);
        showNotification(error.message || 'Failed to generate PPTX', 'error');
    } finally {
        showLoading(false);
    }
}

// Show loading indicator
function showLoading(show) {
    console.log('showLoading():', show);
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    console.log(`Notification [${type}]: ${message}`);
    let container = document.getElementById('notification-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Update large preview
function updateLargePreview() {
    const previewLarge = document.getElementById('slide-preview-large');
    if (!previewLarge) return;
    
    if (!currentSlides[selectedSlideIndex] || !currentSlides[selectedSlideIndex].content.trim()) {
        previewLarge.innerHTML = '<div class="placeholder-text">Select a slide to preview</div>';
        return;
    }
    
    const slide = currentSlides[selectedSlideIndex];
    
    if (typeof marked !== 'undefined') {
        previewLarge.innerHTML = marked.parse(slide.content);
    } else {
        previewLarge.innerHTML = `<pre>${slide.content}</pre>`;
    }
}
// 既存のコードはすべて維持

/**
 * PPTX生成ルールの表示/非表示を切り替え
 */
function toggleRules() {
    const rulesContent = document.getElementById('rulesContent');
    const toggleIcon = document.getElementById('rulesToggleIcon');
    
    if (!rulesContent || !toggleIcon) {
        console.error('Rules elements not found');
        return;
    }
    
    if (rulesContent.style.display === 'none' || rulesContent.style.display === '') {
        rulesContent.style.display = 'block';
        toggleIcon.textContent = '▼';
        toggleIcon.classList.add('expanded');
    } else {
        rulesContent.style.display = 'none';
        toggleIcon.textContent = '▶';
        toggleIcon.classList.remove('expanded');
    }
}
