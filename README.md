# 🎮 Red Ball Escape

**Red Ball Escape** is a fast-paced tilt-controlled maze game built using **React Native + Expo**. Tilt your phone to roll a red ball through randomly generated mazes and reach the goal before the 60-second clock runs out. Every maze you clear scores 100 points and the next one gets bigger. Beat your own high score and test your reflexes!

---

## 📸 Screenshots

<p align="center">
  <img src="assets/screen1.PNG" width="30%" />
  <img src="assets/screen2.PNG" width="30%" />
  <img src="assets/screen3.PNG" width="30%" />
</p>

---

## 🎥 Gameplay Video

[Download Gameplay Video](assets/screen.mp4)

## 🎥 Gameplay Video
![Demo](assets/screen.gif)

---

## 📁 Project Structure

```yaml
RedBallEscape/
├── App.tsx                 # game screen: timer, score, tilt input, levels
├── app.json                # Expo config (icons, splash, permissions, plugins)
├── eas.json                # EAS Build / Submit profiles
├── assets/
│   ├── icon.png, android.adaptiveIcon.foregroundImage.png, splash.image.png
│   └── sounds/ (background.mp3, gameover.mp3, victory.wav)
├── components/             # Ball, Maze, GameOver
├── utils/
│   ├── mazeGenerator.ts    # random solvable mazes, growing with level
│   ├── mazePhysics.ts      # ball-vs-wall collision and movement
│   └── soundManager.ts     # music, effects, saved mute setting
└── __tests__/maze.test.ts
```

`android/` and `ios/` are not committed: they are generated from `app.json` by
`npx expo prebuild` (Expo's Continuous Native Generation).

**Frontend**: React Native 0.88 (Expo SDK 58)  
**Language**: TypeScript  
**Motion**: expo-sensors Accelerometer  
**Sound**: expo-audio

---

## 🔄 Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/your-username/RedBallEscape.git
cd RedBallEscape

# 2. Install dependencies
npm install
# or
yarn install

# 3. Start the development server
npm start
# or
yarn start
```

## ✅ Tests

```bash
npm test          # Jest (jest-expo preset)
npm run typecheck # TypeScript
```

---

## 📦 Android Release Build

**Requirements:** Node 20+. For local native builds also JDK 17 and Android SDK
Platform 37 + Build-Tools 37 (`sdkmanager "platforms;android-37.0" "build-tools;37.0.0"`).

The app targets API 36, as Google Play requires for new apps and updates.

### Option A: EAS Build (recommended)

```bash
npx eas-cli login
npx eas-cli build --platform android --profile preview      # installable .apk for testing
npx eas-cli build --platform android --profile production   # signed .aab for Google Play
npx eas-cli submit --platform android
```

EAS generates and stores the upload key and increments `versionCode` remotely (`eas.json`).

### Option B: Local build

```bash
npx eas-cli build --platform android --profile production --local   # signed with your EAS credentials
```

or, for a quick test build on a connected device/emulator:

```bash
npx expo run:android --variant release
```

A plain `npx expo prebuild && cd android && ./gradlew bundleRelease` signs with the
debug key, which Google Play rejects. Use EAS for anything you upload.

---

## 🧠 Features

- 🔄 Tilt-controlled red ball (accelerometer)
- 🧱 Auto-generated dynamic mazes
- ⏱️ Timer + Score + High Score tracking
- 🔊 Background music and victory / game-over sounds (mute is remembered)
- 📱 Mobile-optimized design

---

## 💡 Future Improvements

- Global leaderboard (Firebase or Supabase)
- New maze themes and skins
- Power-ups and traps

---

## 🤝 Contributing

```bash
# Fork the repository
# Create your feature branch (git checkout -b feature/YourFeature)
# Commit your changes (git commit -m 'Add your feature')
# Push to the branch (git push origin feature/YourFeature)
# Open a Pull Request
```

---

## 📝 License

This project is licensed under the MIT License.

---

## 📣 Author

Made with ❤️ by **Sonal Jaiswal**  
📬 Reach out via [GitHub](https://github.com/sonal-jaiswal) 