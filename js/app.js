// --- 1. INISIALISASI & UTILITAS ---
const randomizeHue = () => {
    const hue = Math.floor(Math.random() * 360);
    document.documentElement.style.setProperty('--hue', hue);
};

// --- 2. HEADER & TEMA ---
const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        // randomizeHue(); // Opsional: acak hue background blob saat ganti tema
    });
};

const updateHeader = () => {
    const now = new Date();
    // Jam
    document.getElementById('clock').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    // Tanggal
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('date').textContent = now.toLocaleDateString('id-ID', options);
    // Sapaan
    const hour = now.getHours();
    let greeting = 'Malam';
    if (hour >= 4 && hour < 11) greeting = 'Pagi';
    else if (hour >= 11 && hour < 15) greeting = 'Siang';
    else if (hour >= 15 && hour < 18) greeting = 'Sore';
    document.getElementById('time-greeting').textContent = greeting;
};

const initUserName = () => {
    const nameEl = document.getElementById('user-name');
    nameEl.textContent = localStorage.getItem('userName') || 'Eriq';
    nameEl.addEventListener('blur', () => localStorage.setItem('userName', nameEl.textContent.trim() || 'Eriq'));
};

const quotes = ["Satu langkah kecil setiap hari.", "Fokus pada proses, bukan hanya hasil.", "Mulai saja dulu, sempurnakan nanti.", "Disiplin mengalahkan motivasi."];
document.getElementById('quote').textContent = quotes[Math.floor(Math.random() * quotes.length)];

// --- 3. AUDIO API SYNTHESIS ---
const playAlarm = () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const playTone = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        gain.gain.setValueAtTime(1, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        osc.stop(startTime + duration);
    };
    const now = ctx.currentTime;
    playTone(987, now, 0.4); playTone(1318, now + 0.4, 0.4);
    playTone(987, now + 0.8, 0.4); playTone(1318, now + 1.2, 0.4);
};

let bowlCtx, bowlIntervalId;
const playTibetanBowl = () => {
    if (!bowlCtx) bowlCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (bowlCtx.state === 'suspended') bowlCtx.resume();
    
    const hitBowl = () => {
        const now = bowlCtx.currentTime;
        const freqs = [256, 258.5, 720];
        const maxGains = [0.05, 0.02, 0.005];
        
        freqs.forEach((freq, i) => {
            const osc = bowlCtx.createOscillator();
            const gain = bowlCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            osc.connect(gain);
            gain.connect(bowlCtx.destination);
            
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(maxGains[i], now + 0.5);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 4);
            
            osc.start(now);
            osc.stop(now + 4);
        });
    };
    
    hitBowl();
    bowlIntervalId = setInterval(hitBowl, 8000);
};

const stopTibetanBowl = () => {
    if (bowlIntervalId) clearInterval(bowlIntervalId);
};

// --- 4. POMODORO TIMER ---
let pomoTimer, timeLeft, isFocusMode = true, isRunning = false;
let focusMin = parseInt(localStorage.getItem('focusMin')) || 25;
let breakMin = parseInt(localStorage.getItem('breakMin')) || 5;

const updateTimerDisplay = () => {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').textContent = `${m}:${s}`;
};

const setPomoMode = (focus) => {
    isFocusMode = focus;
    timeLeft = (isFocusMode ? focusMin : breakMin) * 60;
    document.getElementById('btn-focus').classList.toggle('active', isFocusMode);
    document.getElementById('btn-break').classList.toggle('active', !isFocusMode);
    updateTimerDisplay();
    pauseTimer();
};

const startTimer = () => {
    if (isRunning) return;
    isRunning = true;
    pomoTimer = setInterval(() => {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();
        } else {
            playAlarm();
            setPomoMode(!isFocusMode); // Auto switch
            startTimer();
        }
    }, 1000);
};

const pauseTimer = () => { clearInterval(pomoTimer); isRunning = false; };
const resetTimer = () => setPomoMode(isFocusMode);

document.getElementById('btn-start').addEventListener('click', startTimer);
document.getElementById('btn-pause').addEventListener('click', pauseTimer);
document.getElementById('btn-reset').addEventListener('click', resetTimer);
document.getElementById('btn-focus').addEventListener('click', () => setPomoMode(true));
document.getElementById('btn-break').addEventListener('click', () => setPomoMode(false));

document.getElementById('input-focus').value = focusMin;
document.getElementById('input-break').value = breakMin;
document.getElementById('btn-save-pomo').addEventListener('click', () => {
    focusMin = parseInt(document.getElementById('input-focus').value) || 25;
    breakMin = parseInt(document.getElementById('input-break').value) || 5;
    localStorage.setItem('focusMin', focusMin);
    localStorage.setItem('breakMin', breakMin);
    setPomoMode(isFocusMode);
});

// --- 5. DAFTAR TUGAS ---
let todos = JSON.parse(localStorage.getItem('todos')) || [];

const saveTodos = () => localStorage.setItem('todos', JSON.stringify(todos));

const renderTodos = () => {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';

    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        if (todo.completed) li.classList.add('completed');
        
        li.innerHTML = `
            <span class="task-text">${todo.text}</span>
            <div class="task-actions">
                <button class="edit-btn">✏️</button>
                <button class="del-btn">✕</button>
            </div>
        `;
        
        li.querySelector('.task-text').addEventListener('click', () => {
            todo.completed = !todo.completed;
            saveTodos(); renderTodos();
        });
        li.querySelector('.edit-btn').addEventListener('click', () => {
            const newText = prompt('Edit tugas:', todo.text);
            if (newText && newText.trim() !== '') {
                todo.text = newText.trim();
                saveTodos(); renderTodos();
            }
        });
        li.querySelector('.del-btn').addEventListener('click', () => {
            todos.splice(index, 1);
            saveTodos(); renderTodos();
        });
        
        list.appendChild(li);
    });
};

document.getElementById('btn-add-todo').addEventListener('click', () => {
    const input = document.getElementById('todo-input');
    const text = input.value.trim();
    if (!text) return;
    if (todos.some(t => t.text.toLowerCase() === text.toLowerCase())) {
        alert('Tugas ini sudah ada di daftar!'); return;
    }
    todos.push({ text, completed: false });
    input.value = '';
    saveTodos(); renderTodos();
});

document.getElementById('btn-sort').addEventListener('click', () => {
    todos.sort((a, b) => (a.completed === b.completed) ? 0 : a.completed ? 1 : -1);
    saveTodos(); renderTodos();
});

// --- 6. CATATAN CEPAT ---
const scratchpad = document.getElementById('scratchpad');
scratchpad.value = localStorage.getItem('scratchpad') || '';
scratchpad.addEventListener('input', (e) => {
    localStorage.setItem('scratchpad', e.target.value);
});

// --- 7. LOGIKA PENGINGAT MINUM AIR GLOBAL ---
let isWaterActive = localStorage.getItem('waterActive') === 'true';
const waterStatusBtn = document.getElementById('water-status-btn');
const waterModal = document.getElementById('water-modal');
let waterTimerId;

const updateWaterStatusBtn = () => {
    waterStatusBtn.innerHTML = `💧 Minum: ${isWaterActive ? '<span style="color:#0f0;">Aktif</span>' : '<span style="color:#f00;">Mati</span>'}`;
};

const showWaterModal = () => {
    waterModal.classList.remove('hidden');
    playTibetanBowl();
};

const manageWaterCycle = () => {
    if (waterTimerId) clearInterval(waterTimerId);
    if (isWaterActive) {
        // 1 Jam = 3600000 ms
        waterTimerId = setInterval(showWaterModal, 3600000); 
    }
};

const toggleWaterReminder = () => {
    isWaterActive = !isWaterActive;
    localStorage.setItem('waterActive', isWaterActive);
    updateWaterStatusBtn();
    manageWaterCycle();
};

waterStatusBtn.addEventListener('click', toggleWaterReminder);

document.getElementById('btn-close-water').addEventListener('click', () => {
    waterModal.classList.add('hidden');
    stopTibetanBowl();
    // manageWaterCycle(); // Opsional: reset timer agar satu jam penuh lagi setelah ditutup
});

// Render Awal
randomizeHue();
initTheme();
setInterval(updateHeader, 1000);
updateHeader();
initUserName();
setPomoMode(true);
renderTodos();
updateWaterStatusBtn();
manageWaterCycle();