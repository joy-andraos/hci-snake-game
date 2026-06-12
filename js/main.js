window.logCommand = function(direction) {
    const commandLog = document.getElementById('command-log');
    if (!commandLog) return;
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = direction;
    commandLog.prepend(entry);
    setTimeout(() => entry.classList.add('fade'), 1000);
    setTimeout(() => entry.remove(), 2200);
    while (commandLog.children.length > 4) commandLog.removeChild(commandLog.lastChild);
};

document.addEventListener('DOMContentLoaded', () => {
    const modeSelect     = document.getElementById('mode-select');
    const startBtn       = document.getElementById('start-btn');
    const webcam         = document.getElementById('webcam');
    const startScreen    = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const speedBtns      = document.querySelectorAll('.speed-btn');
    const bestDisplay    = document.getElementById('best-display');
    const poseMsg = document.getElementById('pose-unavailable-mobile');

    poseMsg.style.display = 'none';

    let currentMode = 'keyboard';
    const signEl    = document.getElementById('detected-sign');
    const camOff    = document.getElementById('camera-inactive');

    // Set initial state (keyboard)
    signEl.textContent = 'KEYBOARD MODE ON';
    camOff.classList.remove('hidden');

    // Best score per mode (persisted)
    const LS_PREFIX = 'hci_snake_best_';
    const modes = ['keyboard', 'gesture', 'sound', 'pose'];

    function getBest(mode) {
        return parseInt(localStorage.getItem(LS_PREFIX + mode) || '0', 10);
    }
    function setBest(mode, score) {
        localStorage.setItem(LS_PREFIX + mode, score);
    }

    let bestScore = getBest(currentMode);
    bestDisplay.textContent = bestScore;

    // Speed buttons
    speedBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            speedBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            SnakeGame.setSpeed(parseInt(btn.dataset.speed));
        });
    });

    const highScoreAudio = new Audio('audios/new-high-score-sound.mp3');
    highScoreAudio.preload = 'auto';

    function unlockAudio() {
        // Silent blank MP3 to wake the audio context without firing highScoreAudio
        const silent = new Audio("data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjU0AAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//tQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV");
        silent.play().catch(() => {});
    }
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('click', unlockAudio, { once: true });

    // Best score hook (called by snake.js on game over)
    window.onGameOver = function(finalScore) {
        const isNewBest = finalScore > bestScore;
        if (isNewBest) {
            bestScore = finalScore;
            bestDisplay.textContent = bestScore;
            setBest(currentMode, bestScore);
            document.getElementById('best-' + currentMode).textContent = bestScore;
            highScoreAudio.currentTime = 0;
            highScoreAudio.play().catch(err => console.warn('Audio playback failed:', err));
        }
        const newBestEl = document.getElementById('new-best-label');
        if (newBestEl) newBestEl.classList.toggle('hidden', !isNewBest);
    };

    // Start / restart
    function resetAndLaunch() {
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        startWithCountdown();
    }

    function startWithCountdown() {
        const countdown = document.getElementById('countdown');
        let count = 3;
        SnakeGame.preview();
        countdown.textContent = count;
        countdown.classList.remove('hidden');
        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                countdown.textContent = count;
            } else {
                clearInterval(interval);
                countdown.classList.add('hidden');
                SnakeGame.start();
            }
        }, 800);
    }

    // Keyboard
    window.addEventListener('keydown', (e) => {
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
        if (e.key === 'Enter') {
            const startVisible    = !startScreen.classList.contains('hidden');
            const gameOverVisible = !gameOverScreen.classList.contains('hidden');
            if (startVisible || gameOverVisible) resetAndLaunch();
            return;
        }
        if (currentMode !== 'keyboard') return;
        if (e.key === 'ArrowUp')    SnakeGame.changeDirection('UP');
        if (e.key === 'ArrowDown')  SnakeGame.changeDirection('DOWN');
        if (e.key === 'ArrowLeft')  SnakeGame.changeDirection('LEFT');
        if (e.key === 'ArrowRight') SnakeGame.changeDirection('RIGHT');
    });

    startBtn.addEventListener('click', resetAndLaunch);
    // Touch tap to start / restart (mobile)
    startScreen.addEventListener('touchend', e => {
        e.preventDefault();
        resetAndLaunch();
    });

    gameOverScreen.addEventListener('touchend', e => {
        e.preventDefault();
        resetAndLaunch();
    });

    // Mode selector
    modeSelect.addEventListener('change', async (e) => {
        AudioControl.stop();
        GestureControl.stop();
        PoseControl.stop();
        webcam.classList.remove('visible');
        document.getElementById('command-log').innerHTML = '';

        currentMode = e.target.value;
        bestScore = getBest(currentMode);
        bestDisplay.textContent = bestScore;

        signEl.textContent = '';
        camOff.classList.add('hidden');

        const isMobile = window.innerWidth <= 700;
        const screenWrapper = document.getElementById('screen-wrapper');
        const sidePanel = document.getElementById('side-panel');
        const poseMsg = document.getElementById('pose-unavailable-mobile');

        // Reset pose-mobile layout
        poseMsg.style.display = 'none';
        screenWrapper.style.display = '';
        sidePanel.style.display = '';

        if (currentMode === 'pose' && isMobile) {
            // Hide game area and side panel, show message
            screenWrapper.style.display = 'none';
            sidePanel.style.display = 'none';
            poseMsg.style.display = 'flex';
            return;
        }

        if (currentMode === 'keyboard') {
            signEl.textContent = 'KEYBOARD MODE ON';
            camOff.classList.remove('hidden');
        } else if (currentMode === 'sound') {
            signEl.textContent = 'VOICE MODE ON';
            camOff.classList.remove('hidden');
            await AudioControl.start();
        } else if (currentMode === 'gesture') {
            await GestureControl.start();
            webcam.classList.add('visible');
        } else if (currentMode === 'pose') {
            await PoseControl.start();
            webcam.classList.add('visible');
        }
    });

    // Instructions modal
    function initModal(modalId, openBtnId, closeBtnId) {
        const modal   = document.getElementById(modalId);
        const helpBox = document.getElementById('help-box');

        function openModal() {
            modal.classList.remove('hidden');
            bodyScrollLock.disableBodyScroll(helpBox);
        }
        function closeModal() {
            modal.classList.add('hidden');
            bodyScrollLock.enableBodyScroll(helpBox);
        }

        document.getElementById(openBtnId).addEventListener('click', openModal);
        document.getElementById(closeBtnId).addEventListener('click', closeModal);
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
    }
    initModal('help-modal', 'help-btn', 'help-close');

    const scoresModal = document.getElementById('scores-modal');
    document.getElementById('scores').addEventListener('click', () => {
        modes.forEach(m => {
            document.getElementById('best-' + m).textContent = getBest(m);
        });
        scoresModal.classList.remove('hidden');
    });
    document.getElementById('scores-close').addEventListener('click', () => {
        scoresModal.classList.add('hidden');
    });
    scoresModal.addEventListener('click', e => {
        if (e.target === scoresModal) scoresModal.classList.add('hidden');
    });

    // Prevent page scroll on touch
    document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

    // Touch swipe controls (mobile)
    (function initTouchControls() {
        let touchStartX = 0;
        let touchStartY = 0;
        const minSwipeDistance = 30;

        window.addEventListener('touchstart', e => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        window.addEventListener('touchend', e => {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            if (Math.max(Math.abs(dx), Math.abs(dy)) < minSwipeDistance) return;
            if (Math.abs(dx) > Math.abs(dy)) {
                SnakeGame.changeDirection(dx > 0 ? 'RIGHT' : 'LEFT');
            } else {
                SnakeGame.changeDirection(dy > 0 ? 'DOWN' : 'UP');
            }
        }, { passive: true });
    })();
});