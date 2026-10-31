# Smartnotes AI

Learn Smarter. Understand Better.

A React + TypeScript study app for Classes 9–12 (NCERT, CBSE, HBSE), packaged for Android with Capacitor. Package ID: `com.smartnotesai.app`.

You can build the Android APK entirely from a phone, using GitHub's free cloud servers. No computer or paid plan is needed.

---

## What's included

- Login and registration, bottom navigation, Home, Books, AI Tutor, My Notes, Profile
- Subjects for Classes 9–12, a chapter reader with bookmarks, font size and print
- Chapter quiz with instant feedback, quiz history and weak-topic list
- Notes with seven note types and a basic Cornell layout
- Search, daily study goal, dark mode, Hindi labels
- Android back button support
- GitHub Actions workflow that builds a debug APK

## What is not included yet

- Cloud accounts and sync (data stays on the phone)
- An AI tutor that answers open questions (needs a secure server-side key)
- Admin panel, timed quizzes, diagrams
- Custom app icon and splash screen (Capacitor defaults are used)
- Signed release builds for Google Play

Chapter content is sample study material. Check it against your NCERT textbook before use.

---

## Step 1: Get the project onto your phone

1. Download `smartnotes-ai-project.zip` from the chat.
2. Open it in the **Files** app and extract it. Google Files and Samsung My Files can extract zip files.

## Step 2: Create a GitHub repository

1. Create a free account at **github.com** if you don't have one.
2. Tap **+** → **New repository**.
3. Name it `smartnotes-ai`. Choose **Private** or **Public**. Tap **Create repository**.

## Step 3: Upload the files

GitHub's mobile upload can't handle folders well, so use the desktop site:

1. Open **github.com** in Chrome. Tap the **⋮** menu → tick **Desktop site**.
2. On the repository page, tap **Add file** → **Upload files**.
3. Select the files at the top level of the extracted folder: `package.json`, `capacitor.config.ts`, `vite.config.ts`, `tsconfig.json`, `index.html`, `README.md`, `.gitignore`. Tap **Commit changes**.
4. Tap **Add file** → **Create new file**. Type `src/App.tsx` as the name, paste the contents from the extracted `src/App.tsx`, then commit. Repeat for `src/main.tsx`, `src/data.ts` and `src/styles.css`.
5. For the workflow, tap **Add file** → **Create new file**, type `.github/workflows/android.yml`, paste the contents of that file from the extracted folder, then commit.

Check that the repository shows `src/` and `.github/workflows/` folders.

## Step 4: Run the cloud build

1. Tap the **Actions** tab.
2. Tap **Build Android debug APK** → **Run workflow** → **Run workflow**.
3. Wait about 5–10 minutes. A green tick means success. A red cross means a failure: tap the run and read the first red step.

## Step 5: Download the APK

1. Open the finished run (green tick).
2. Scroll to **Artifacts** and tap **smartnotes-ai-debug-apk**. The download is a zip.
3. Extract it in the Files app. Inside is `app-debug.apk`.

## Step 6: Install on your Android phone

1. Tap `app-debug.apk`.
2. If prompted, allow installs from this source (Settings → Install unknown apps → your browser or Files app).
3. Tap **Install**, then open **Smartnotes AI**.

Debug APKs are signed with a development key. They install fine for personal use but are not for Play Store publishing.

---

## Troubleshooting

- **Build fails at "Build web app":** a TypeScript or import error. Check the file names and paste errors.
- **Build fails at "Build debug APK":** open the step log and look for the first line containing `FAILURE`. Re-run the workflow once to rule out a temporary network issue.
- **Artifact missing:** the APK path only exists after a successful build.
- **"App not installed":** uninstall any older Smartnotes AI build first, or use a fresh install.

## Later: Play Store (AAB)

A Play Store release needs a signing keystore, a release build (`./gradlew bundleRelease`) and a Google Play developer account (a one-time fee). Keep the keystore safe. Add it later as a GitHub Actions secret and extend the workflow.

## Local development (optional, needs a computer)

```bash
npm install
npm run dev        # browser preview
npm run build      # production web build into dist/
npx cap add android
npx cap sync android
```
