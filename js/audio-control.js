const AudioControl = (() => {
    let recognizer = null;
    let isListening = false;
    let lastCommandTime = 0;
    const commandCooldownMs = 400; // Limits input spamming

    async function start() {
        if (isListening) return;

        try {
            const loadingText = document.getElementById('loading-text');
            const loadingOverlay = document.getElementById('loading-overlay');
            
            if (loadingText) loadingText.innerText = "Initializing Voice Processing...";
            if (loadingOverlay) loadingOverlay.classList.remove('hidden');

            recognizer = speechCommands.create("BROWSER_FFT");
            await recognizer.ensureModelLoaded();

            if (loadingOverlay) loadingOverlay.classList.add('hidden');
            isListening = true;
            console.log("🎤 Audio recognition framework activated!");

            recognizer.listen(result => {
                const now = Date.now();
                if (now - lastCommandTime < commandCooldownMs) return;

                const scores = result.scores;
                const labels = recognizer.wordLabels();
                let highestScoreIdx = 0;
                let maxScore = 0;

                highestScoreIdx = Array.from(scores).indexOf(Math.max(...scores));

                const command = labels[highestScoreIdx].toUpperCase();
                
                if (maxScore > 0.80 && ['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(command)) {
                    window.logCommand(command);
                    const signEl = document.getElementById('detected-sign');
                    if (signEl) signEl.textContent = command;
                    SnakeGame.changeDirection(command);
                    lastCommandTime = now;
                }
            }, {
                includeSpectrogram: false,
                probabilityThreshold: 0.80,
                invokeCallbackOnNoiseAndUnknown: true,
                overlapFactor: 0.50
            });

        } catch (error) {
            console.error("Audio initialization failed:", error);
            const loadingText = document.getElementById('loading-text');
            if (loadingText) loadingText.innerText = "Microphone Access Denied";
            alert("Could not access microphone. Check system privacy settings.");
        }
    }


    function stop() {
        if (recognizer && isListening) {
            recognizer.stopListening();
            isListening = false;
            console.log("🎤 Audio processing stopped.");
        }
    }

    return { start, stop };
})();
