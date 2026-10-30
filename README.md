# 🎮 Red Ball Escape

**Red Ball Escape** is a fast-paced gyro-controlled maze game built using **React Native + Expo**. Navigate a red ball through dynamically generated mazes, dodge obstacles, and race against time to reach the goal. Designed for mobile devices, the game utilizes the device's gyroscope to create an immersive experience. Beat your own high score and test your reflexes!

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
Ball-Maze-main/
├── .gitignore
├── App.tsx
├── app.json
├── assets/
│   ├── adaptive-icon.png
│   ├── favicon.png
│   ├── icon.png
│   ├── splash-icon.png
│   └── sounds/
│       ├── background.mp3
│       ├── collision.mp3
│       ├── gameover.mp3
│       ├── move.mp3
│       └── victory.mp3
├── components/
│   ├── Ball.tsx
│   ├── GameOver.tsx
│   └── Maze.tsx
├── utils/
│   ├── mazeGenerator.ts
│   ├── mazePhysics.ts
│   └── soundManager.ts
├── index.ts
├── package.json
├── package-lock.json
└── tsconfig.json
```

**Frontend**: React Native (Expo)  
**Language**: TypeScript  
**Motion**: DeviceMotion APIs (Gyroscope)  
**Sound**: expo-av

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

**Requirements:** Node 20+, JDK 17, Android SDK Platform 36 and Build-Tools 35+
(`sdkmanager "platforms;android-36"`).

The app targets API 36, as Google Play requires for new apps and updates.

### Option A: EAS Build (recommended)

```bash
npx eas build --platform android --profile production   # produces a signed .aab
npx eas submit --platform android
```

EAS stores the upload key and increments `versionCode` remotely (`eas.json`).

### Option B: Local Gradle build

Put the upload-key settings in `~/.gradle/gradle.properties` (never in this repo),
or export them as environment variables:

```properties
BALLMAZE_UPLOAD_STORE_FILE=/absolute/path/to/upload-key.jks
BALLMAZE_UPLOAD_STORE_PASSWORD=...
BALLMAZE_UPLOAD_KEY_ALIAS=...
BALLMAZE_UPLOAD_KEY_PASSWORD=...
```

```bash
cd android
./gradlew bundleRelease
# -> android/app/build/outputs/bundle/release/app-release.aab
```

If the `BALLMAZE_UPLOAD_*` values are missing, the bundle is built **unsigned** and
Play will not accept it. Increase `versionCode` in `android/app/build.gradle`
before every local upload. EAS does this for you.

---

## 🧠 Features

- 🔄 Gyroscope-based red ball movement
- 🧱 Auto-generated dynamic mazes
- ⏱️ Timer + Score + High Score tracking
- 🔊 Immersive sound effects
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