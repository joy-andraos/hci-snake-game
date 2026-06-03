const GestureControl = (() => {
    let detector = null;
    let videoElement = null;
    let localStream = null;
    let isTracking = false;
    let lastGestureTime = 0;
    const gestureCooldownMs = 300; // Smooths out consecutive frame loops

    async function start() {
        if (isTracking) return;
        videoElement = document.getElementById('webcam');

        try {
            const loadingText = document.getElementById('loading-text');
            const loadingOverlay = document.getElementById('loading-overlay');

            if (loadingText) loadingText.innerText = "Loading Hand Tracking Shaders...";
            if (loadingOverlay) loadingOverlay.classList.remove('hidden');

            const model = handPoseDetection.SupportedModels.MediaPipeHands;
            const detectorConfig = {
                runtime: 'mediapipe',
                solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915'
            };
            detector = await handPoseDetection.createDetector(model, detectorConfig);


            
            localStream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480, facingMode: "user" } 
            });
            videoElement.srcObject = localStream;

            if (loadingOverlay) loadingOverlay.classList.add('hidden');
            isTracking = true;
            
            videoElement.onloadeddata = () => { trackingLoop(); };
            console.log("📷 Camera computer vision runtime activated!");

        } catch (error) {
            console.error("Video initialization failed:", error);
            const loadingText = document.getElementById('loading-text');
            if (loadingText) loadingText.innerText = "Webcam Access Denied";
            alert("Could not access camera. Check browser permissions.");
        }
    }


    async function trackingLoop() {
        if (!isTracking) return;

        try {
            // flipHorizontal mirrors physical space for accurate coordinates
            const hands = await detector.estimateHands(videoElement, { flipHorizontal: true });

            if (hands && hands.length > 0) {
                const now = Date.now();
                const points = hands[0].keypoints; // Target primary hand detected

                const indexTip = points[8];   // Index Finger Tip
                const indexBase = points[5];  // Index Finger Base Knuckle
                const wrist = points[0];      // Wrist Joint Reference point

                // // Compute positions needed for gesture classification
                const verticalDelta = indexBase.y - indexTip.y; // Positive means pointing Up
                const horizontalDelta = indexTip.x - wrist.x;   // Position relative to wrist center

                let detectedGesture = null;

                // Threshold 1: ☝️ UP
                if (verticalDelta > 55 && Math.abs(indexTip.x - indexBase.x) < 35) {
                    detectedGesture = "UP";
                }
                // Threshold 2: 👇 DOWN
                else if (verticalDelta < -35 && Math.abs(indexTip.x - indexBase.x) < 35) {
                    detectedGesture = "DOWN";
                }
                // Threshold 3: 👈 LEFT vs 👉 RIGHT (X increases left-to-right)
                else if (Math.abs(horizontalDelta) > 80 && Math.abs(indexTip.y - indexBase.y) < 35) {
                    detectedGesture = horizontalDelta > 0 ? "RIGHT" : "LEFT";
                }

                // Inject command straight to the active snake instance if off cooldown
                if (detectedGesture && (now - lastGestureTime > gestureCooldownMs)) {
                    window.logCommand(detectedGesture);
                    const signEl = document.getElementById('detected-sign');
                    if (signEl) signEl.textContent = detectedGesture;
                    SnakeGame.changeDirection(detectedGesture);
                    lastGestureTime = now;
                }
            }
        } catch (err) {
            console.error("Tracking frame loop execution error:", err);
        }

        if (isTracking) {
            requestAnimationFrame(trackingLoop);
        }
    }

    function stop() {
        isTracking = false;
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
            localStream = null;
            console.log("📷 Camera capture feed stopped.");
        }
    }

    return { start, stop };
})();
