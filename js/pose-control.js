const PoseControl = (() => {
    let detector = null;
    let videoElement = null;
    let localStream = null;
    let isTracking = false;
    let lastPoseTime = 0;
    const poseCooldownMs = 500; // Gives user time to return to a neutral position

    async function start() {
        if (isTracking) return;
        videoElement = document.getElementById('webcam');

        try {
            const loadingText = document.getElementById('loading-text');
            const loadingOverlay = document.getElementById('loading-overlay');

            if (loadingText) loadingText.innerText = "Loading Full-Body Pose Shaders...";
            if (loadingOverlay) loadingOverlay.classList.remove('hidden');

            const model = poseDetection.SupportedModels.BlazePose;
            const detectorConfig = {
                runtime: 'mediapipe',
                modelType: 'full',
                solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose'
            };
            detector = await poseDetection.createDetector(model, detectorConfig);

            localStream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480, facingMode: "user" },
                audio: false
            });
            videoElement.srcObject = localStream;

            if (loadingOverlay) loadingOverlay.classList.add('hidden');
            isTracking = true;
            
            videoElement.onloadeddata = () => { trackingLoop(); };
            console.log("🏃 Pose tracking computer vision runtime activated!");

        } catch (error) {
            console.error("Pose initialization failed:", error);
            const loadingText = document.getElementById('loading-text');
            if (loadingText) loadingText.innerText = "Webcam Access Denied";
            alert("Could not access camera. Check browser permissions.");
        }
    }

    async function trackingLoop() {
        if (!isTracking) return;

        try {
            if (detector && videoElement.readyState >= 2) {
                // flipHorizontal mirrors physical space for accurate coordinates
                const poses = await detector.estimatePoses(videoElement, { flipHorizontal: true });

                if (poses && poses.length > 0) {
                    const now = Date.now();
                    const points = poses[0].keypoints; // Target primary body detected

                    const nose = points.find(k => k.name === 'nose');
                    const leftShoulder = points.find(k => k.name === 'left_shoulder');
                    const rightShoulder = points.find(k => k.name === 'right_shoulder');
                    const leftWrist = points.find(k => k.name === 'left_wrist');
                    const rightWrist = points.find(k => k.name === 'right_wrist');
                    const leftHip = points.find(k => k.name === 'left_hip');
                    const rightHip = points.find(k => k.name === 'right_hip');
                    const leftKnee = points.find(k => k.name === 'left_knee');
                    const rightKnee = points.find(k => k.name === 'right_knee');

                    if (nose && leftShoulder && rightShoulder && nose.score > 0.6) {                                                
                        // Compute positions and distances needed for pose classification
                        const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
                        const hipCenterY = (leftHip.y + rightHip.y) / 2;
                        const kneeCenterY = (leftKnee.y + rightKnee.y) / 2;

                        let detectedPose = null;

                        // THRESHOLD 1 (UP): JUMPING JACK / ARMS UP
                        // Both wrists above shoulders AND wide apart
                        const leftWristUp = leftWrist.y < leftShoulder.y;
                        const rightWristUp = rightWrist.y < rightShoulder.y;
                        const handsUp = leftWristUp && rightWristUp;
                        const handsWide = Math.abs(leftWrist.x - rightWrist.x) > shoulderWidth * 1.5;

                        // THRESHOLD 1 (UP): Both wrists raised and wide apart
                        if (handsUp && handsWide) {
                            detectedPose = "UP";
                        }

                        // THRESHOLD 2 & 3 (LEFT & RIGHT): One arm extended sideways
                        else if (leftWrist.score >= 0.4 || rightWrist.score >= 0.4) {
                            const leftSideExtended =
                                (rightShoulder.x - rightWrist.x) > shoulderWidth * 0.3 &&
                                Math.abs(rightWrist.y - rightShoulder.y) < 80;

                            const rightSideExtended =
                                (leftWrist.x - leftShoulder.x) > shoulderWidth * 0.3 &&
                                Math.abs(leftWrist.y - leftShoulder.y) < 80;

                            if (leftSideExtended && !rightSideExtended) detectedPose = "LEFT";
                            else if (rightSideExtended && !leftSideExtended) detectedPose = "RIGHT";
                        }

                        // THRESHOLD 4 (DOWN): Squat
                        else {
                            const hipKneeDistance = Math.abs(hipCenterY - kneeCenterY);
                            const standardTorsoHeight = Math.abs(nose.y - hipCenterY);
                            if (hipKneeDistance < standardTorsoHeight * 0.45) detectedPose = "DOWN";
                        }
                        // Inject command straight to the active snake instance if off cooldown
                        if (detectedPose && (now - lastPoseTime > poseCooldownMs)) {
                            window.logCommand(detectedPose);
                            const signEl = document.getElementById('detected-sign');
                            if (signEl) signEl.textContent = detectedPose;
                            SnakeGame.changeDirection(detectedPose);
                            lastPoseTime = now;
                        }
                    }
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
            console.log("🏃 Pose capture feed stopped.");
        }
    }

    return { start, stop };
})();