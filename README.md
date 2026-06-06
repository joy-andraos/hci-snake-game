# 🐍 HCI Snake Game

The classic Snake game that you can control with your hands, voice, or body.

🔗 **[Click here to try it](https://joy-andraos.github.io/hci-snake-game/)**

## What is HCI?

Human-Computer Interaction (HCI) explores how people interact with technology in order to design intuitive digital systems. In that spirit, this project experiments with hand gestures, voice commands and full-body movement as alternative ways to control a game. All of which run entirely in the browser, with no installation required.

## Motivation

Many of us spend long hours sitting while working or studying. This project began as an attempt to add more movement to my day in a fun way by controlling a game through physical movement.

Snake was a natural choice because of its simplicity in controls, which opened the door to several game modes. Throughout development, I got curious to explore the different models available in the browser and ended up adding two modes: hand gestures and voice commands.

## Game Modes

### 1. Keyboard
The classic. Use your arrow keys to move and Enter to start or restart. You can also play around with the speed for a challenge.

---
### 2. Gestures
Point your index finger in the direction you want the snake to move.

| Direction | Gesture |
|-----------|---------|
| ☝️ Up | Finger pointing up |
| 👇 Down | Finger pointing down |
| 👈 Left | Finger pointing left |
| 👉 Right | Finger pointing right |

> 💡 Best used in good lighting with only your hand in frame. Set speed to SLOW for best accuracy.

---
### 3. Voice
Say "UP", "DOWN", "LEFT", or "RIGHT" out loud to steer the snake.

> 💡 Speak clearly and set speed to SLOW for best accuracy.

---
### 4. Pose
Control the snake with your whole body.

| Direction | Movement |
|-----------|----------|
| 🙆 Up | Raise both arms up wide (jumping jack) |
| 🏋️ Down | Squat down until your body is out of the frame |
| 🫲 Left | Extend your left arm sideways |
| 🫱 Right | Extend your right arm sideways |

> 💡 Stand back from the camera so your full body is visible. Set speed to SLOW for best accuracy.

## How It Works

- **Gestures**: MediaPipe Hands detects 21 hand landmarks in each video frame. 
The game reads the position of your index finger tip relative to its base knuckle 
to classify direction.

- **Voice**: TensorFlow.js runs a pre-trained audio classification model locally 
in your browser. It listens for the words UP, DOWN, LEFT and RIGHT in real time.

- **Pose**: MediaPipe BlazePose detects 33 body landmarks. The game compares 
wrist and shoulder positions to classify which direction you're moving.

> All processing happens locally in your browser. No data is ever sent to a server
and nothing is stored.

## Built With

- Vanilla HTML, CSS, JavaScript
- [TensorFlow.js](https://www.tensorflow.org/js)
- [MediaPipe Hands](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)
- [MediaPipe BlazePose](https://developers.google.com/mediapipe/solutions/vision/pose_landmarker)
- [TensorFlow Speech Commands](https://github.com/tensorflow/tfjs-models/tree/master/speech-commands)
