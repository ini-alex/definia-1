/**
 * Definia - AI Dictionary
 * Main JavaScript File
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initNavigation();
    initSearch();
    initSuggestions();
    initScrollAnimations();
});

/**
 * Navigation functionality
 */
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    // Navbar scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
        
        lastScroll = currentScroll;
    });
    
    // Mobile menu toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking on links
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

/**
 * Search functionality
 */
function initSearch() {
    const wordInput = document.getElementById('wordInput');
    const searchBtn = document.getElementById('searchBtn');
    const mainLang = document.getElementById('mainLang');
    const translateLang = document.getElementById('translateLang');
    const swapBtn = document.getElementById('swapLang');
    const retryBtn = document.getElementById('retryBtn');
    
    if (!wordInput || !searchBtn) return;
    
    // Search on button click
    searchBtn.addEventListener('click', performSearch);
    
    // Search on Enter key
    wordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Swap languages
    if (swapBtn) {
        swapBtn.addEventListener('click', () => {
            const temp = mainLang.value;
            mainLang.value = translateLang.value || 'auto';
            translateLang.value = temp === 'auto' ? '' : temp;
            
            // Add animation class
            swapBtn.style.transform = 'rotate(180deg)';
            setTimeout(() => {
                swapBtn.style.transform = '';
            }, 300);
        });
    }
    
    // Retry button
    if (retryBtn) {
        retryBtn.addEventListener('click', performSearch);
    }
}

/**
 * Perform API search with better error handling
 */
async function performSearch() {
    const wordInput = document.getElementById('wordInput');
    const mainLang = document.getElementById('mainLang');
    const translateLang = document.getElementById('translateLang');
    
    const text = wordInput.value.trim();
    
    if (!text) {
        showError('Silakan masukkan kata yang ingin dicari');
        wordInput.focus();
        return;
    }
    
    // Get language values
    const mainLangValue = mainLang.value;
    const translateValue = translateLang.value;
    
    // Show loading state
    showLoading();
    
    // Prepare request body
    const requestBody = {
        mainLang: mainLangValue,
        text: text
    };
    
    // Only add translate if it's not empty
    if (translateValue) {
        requestBody.translate = translateValue;
    }
    
    console.log('Sending request to API...');
    console.log('Request body:', JSON.stringify(requestBody));
    
    try {
        const response = await fetch('https://definia.alexaputra498.workers.dev/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        console.log('Response status:', response.status);
        console.log('Response statusText:', response.statusText);
        
        // Log response headers for debugging
        const headers = {};
        response.headers.forEach((value, key) => {
            headers[key] = value;
        });
        console.log('Response headers:', headers);
        
        if (!response.ok) {
            // Try to get error details from response
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { message: response.statusText };
            }
            
            console.error('API Error:', errorData);
            
            if (response.status === 0 || response.status === 503) {
                throw new Error('Koneksi gagal. Ini mungkin disebabkan oleh masalah CORS atau server tidak merespons.');
            } else if (response.status === 404) {
                throw new Error('API endpoint tidak ditemukan. Silakan periksa URL.');
            } else if (response.status === 500) {
                throw new Error('Server mengalami kesalahan internal. Silakan coba lagi nanti.');
            } else {
                throw new Error(`HTTP Error ${response.status}: ${errorData.message || response.statusText}`);
            }
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        
        if (data.rejected) {
            showError('Tidak dapat menemukan definisi untuk kata tersebut. Coba kata lain.');
            return;
        }
        
        displayResults(data);
        
    } catch (error) {
        console.error('Fetch Error:', error);
        
        // Handle specific error types
        let errorMessage = 'Terjadi kesalahan saat menghubungi server.';
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage = 'Gagal terhubung ke server. Kemungkinan penyebab:\n\n' +
                          '1. Masalah CORS - API tidak mengizinkan akses dari browser\n' +
                          '2. Server sedang offline atau tidak merespons\n' +
                          '3. Koneksi internet bermasalah\n\n' +
                          'Silakan coba lagi atau hubungi administrator.';
        } else if (error.message.includes('CORS')) {
            errorMessage = error.message;
        } else {
            errorMessage = error.message || 'Terjadi kesalahan yang tidak diketahui. Silakan coba lagi.';
        }
        
        showError(errorMessage);
    }
}

/**
 * Show loading state
 */
function showLoading() {
    hideAllStates();
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
        loadingState.classList.remove('hidden');
    }
}

/**
 * Show error state
 */
function showError(message) {
    hideAllStates();
    const errorState = document.getElementById('errorState');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorState) {
        errorState.classList.remove('hidden');
    }
    if (errorMessage) {
        // Convert newlines to <br> for display
        errorMessage.innerHTML = message.replace(/\n/g, '<br>');
    }
}

/**
 * Hide all states
 */
function hideAllStates() {
    const states = ['loadingState', 'errorState', 'emptyState', 'resultsContainer'];
    states.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('hidden');
        }
    });
}

/**
 * Display search results
 */
function displayResults(data) {
    hideAllStates();
    
    const resultsContainer = document.getElementById('resultsContainer');
    if (resultsContainer) {
        resultsContainer.classList.remove('hidden');
    }
    
    // Main word info
    const resultWord = document.getElementById('resultWord');
    const resultType = document.getElementById('resultType');
    const detectedLang = document.getElementById('detectedLang');
    
    if (resultWord) resultWord.textContent = data.word || '';
    if (resultType) resultType.textContent = data.type || 'unknown';
    if (detectedLang) detectedLang.textContent = data.detected_language || '';
    
    // Dictionary meanings
    if (data.dictionary) {
        const officialMeaning = document.getElementById('officialMeaning');
        const generalMeaning = document.getElementById('generalMeaning');
        
        if (officialMeaning) officialMeaning.textContent = data.dictionary.official_meaning || '-';
        if (generalMeaning) generalMeaning.textContent = data.dictionary.general_meaning || '-';
    }
    
    // Linguistic info
    if (data.linguistic_info) {
        const etymology = document.getElementById('etymology');
        const usageContext = document.getElementById('usageContext');
        
        if (etymology) etymology.textContent = data.linguistic_info.etymology || '-';
        
        if (usageContext) {
            usageContext.innerHTML = '';
            if (data.linguistic_info.usage_context && data.linguistic_info.usage_context.length > 0) {
                data.linguistic_info.usage_context.forEach(context => {
                    const li = document.createElement('li');
                    li.textContent = context;
                    usageContext.appendChild(li);
                });
            }
        }
    }
    
    // Examples
    const examplesList = document.getElementById('examplesList');
    if (examplesList) {
        examplesList.innerHTML = '';
        if (data.examples && data.examples.length > 0) {
            data.examples.forEach(example => {
                const li = document.createElement('li');
                li.textContent = example;
                examplesList.appendChild(li);
            });
        }
    }
    
    // Translation section
    const translationCard = document.getElementById('translationCard');
    if (data.translated) {
        if (translationCard) translationCard.classList.remove('hidden');
        
        const translatedLang = document.getElementById('translatedLang');
        if (translatedLang) translatedLang.textContent = data.translated.language || '';
        
        if (data.translated.dictionary) {
            const translatedOfficial = document.getElementById('translatedOfficial');
            const translatedGeneral = document.getElementById('translatedGeneral');
            
            if (translatedOfficial) translatedOfficial.textContent = data.translated.dictionary.official_meaning || '-';
            if (translatedGeneral) translatedGeneral.textContent = data.translated.dictionary.general_meaning || '-';
        }
        
        if (data.translated.linguistic_info) {
            const translatedEtymology = document.getElementById('translatedEtymology');
            const translatedUsageContext = document.getElementById('translatedUsageContext');
            
            if (translatedEtymology) translatedEtymology.textContent = data.translated.linguistic_info.etymology || '-';
            
            if (translatedUsageContext) {
                translatedUsageContext.innerHTML = '';
                if (data.translated.linguistic_info.usage_context) {
                    data.translated.linguistic_info.usage_context.forEach(context => {
                        const li = document.createElement('li');
                        li.textContent = context;
                        translatedUsageContext.appendChild(li);
                    });
                }
            }
        }
        
        const translatedExamples = document.getElementById('translatedExamples');
        if (translatedExamples) {
            translatedExamples.innerHTML = '';
            if (data.translated.examples) {
                data.translated.examples.forEach(example => {
                    const li = document.createElement('li');
                    li.textContent = example;
                    translatedExamples.appendChild(li);
                });
            }
        }
    } else {
        if (translationCard) translationCard.classList.add('hidden');
    }
    
    // Scroll to results
    if (resultsContainer) {
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Initialize suggestion chips
 */
function initSuggestions() {
    const chips = document.querySelectorAll('.suggestion-chip');
    const wordInput = document.getElementById('wordInput');
    
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const word = chip.getAttribute('data-word');
            if (wordInput && word) {
                wordInput.value = word;
                wordInput.focus();
                performSearch();
            }
        });
    });
}

/**
 * Initialize scroll animations
 */
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-card, .step, .audience-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Add CSS class for animated elements
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);
