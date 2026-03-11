document.addEventListener('DOMContentLoaded', () => {
    const n = document.getElementById('searchBtn');
    const wordInput = document.getElementById('wordInput');
    const mainLang = document.getElementById('mainLang');
    const translateLang = document.getElementById('translateLang');
    const loading = document.getElementById('loading');
    const errorMsg = document.getElementById('errorMessage');
    const resultArea = document.getElementById('resultArea');

    if (!searchBtn) return; // Only run on define.html

    // Update bagian fetching di script.js

searchBtn.addEventListener('click', async () => {
    const text = wordInput.value.trim();
    if (!text) return alert('Masukkan kata terlebih dahulu');

    // Reset UI
    resultArea.classList.add('hidden');
    errorMsg.classList.add('hidden');
    loading.classList.remove('hidden');
    searchBtn.disabled = true;

    // Inisialisasi AbortController untuk handling timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // Set timeout 90 detik

    // Pesan loading dinamis agar user tidak bosan
    const loadingText = loading.querySelector('p');
    const messages = [
        "Menganalisis kata dengan AI...",
        "Menyusun definisi resmi...",
        "Membedah struktur linguistik...",
        "Menerjemahkan konteks..."
    ];
    let msgIndex = 0;
    const msgInterval = setInterval(() => {
        msgIndex = (msgIndex + 1) % messages.length;
        loadingText.innerText = messages[msgIndex];
    }, 5000);

    try {
        const response = await fetch('https://definia.alexaputra498.workers.dev/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mainLang: mainLang.value,
                text: text,
                translate: translateLang.value || undefined
            }),
            signal: controller.signal // Hubungkan sinyal abort ke fetch
        });

        clearTimeout(timeoutId); // Batalkan timeout jika berhasil
        clearInterval(msgInterval); // Berhentikan pesan loading

        const data = await response.json();

        if (data.rejected) {
            showError("Maaf, AI tidak dapat mendefinisikan kata tersebut.");
        } else {
            renderResult(data);
        }

    } catch (err) {
        clearInterval(msgInterval);
        if (err.name === 'AbortError') {
            showError("Koneksi terputus karena respon AI terlalu lama. Silakan coba lagi.");
        } else {
            showError("Terjadi kesalahan koneksi. Pastikan internet Anda stabil.");
        }
    } finally {
        loading.classList.add('hidden');
        searchBtn.disabled = false;
    }
});

function showError(msg) {
    errorMsg.querySelector('p').innerText = msg;
    errorMsg.classList.remove('hidden');
}


    function showError() {
        errorMsg.classList.remove('hidden');
    }

    function renderResult(data) {
        let html = `
            <div class="card animate-up">
                <div class="result-header">
                    <h2 class="word-title">${data.word}</h2>
                    <div class="word-meta">
                        <span><i class="fas fa-tag"></i> ${data.type}</span>
                        <span><i class="fas fa-globe"></i> ${data.detected_language}</span>
                    </div>
                </div>

                <div class="meaning-box">
                    <h4>Pengertian Resmi</h4>
                    <p>${data.dictionary.official_meaning}</p>
                </div>

                <div class="meaning-box">
                    <h4>Pengertian Umum</h4>
                    <p>${data.dictionary.general_meaning}</p>
                </div>

                <h3 class="section-title">Informasi Linguistik</h3>
                <p><strong>Etimologi:</strong> ${data.linguistic_info.etymology}</p>
                <p style="margin-top:10px"><strong>Konteks Penggunaan:</strong></p>
                <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:8px">
                    ${data.linguistic_info.usage_context.map(ctx => `<span class="badge" style="margin:0">${ctx}</span>`).join('')}
                </div>

                <h3 class="section-title">Contoh Penggunaan</h3>
                <ul class="example-list">
                    ${data.examples.map(ex => `<li>"${ex}"</li>`).join('')}
                </div>
            </div>
        `;

        if (data.translated) {
            const tr = data.translated;
            html += `
                <div class="card animate-up" style="border-top: 5px solid var(--primary)">
                    <h2 class="section-title" style="border:none; padding:0; margin-top:0">
                        <i class="fas fa-language"></i> Terjemahan: ${tr.language}
                    </h2>
                    
                    <div class="meaning-box">
                        <h4>Official Meaning</h4>
                        <p>${tr.dictionary.official_meaning}</p>
                    </div>

                    <div class="meaning-box">
                        <h4>General Meaning</h4>
                        <p>${tr.dictionary.general_meaning}</p>
                    </div>

                    <p><strong>Etymology:</strong> ${tr.linguistic_info.etymology}</p>
                    
                    <h3 class="section-title">Examples</h3>
                    <ul class="example-list">
                        ${tr.examples.map(ex => `<li>"${ex}"</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        resultArea.innerHTML = html;
        resultArea.classList.remove('hidden');
        resultArea.scrollIntoView({ behavior: 'smooth' });
    }
});
