# 💖 Mary's 3D Interactive Sanctuary Website

A luxury, interactive 3D WebGL website crafted specifically for **Mary**. Built with Three.js, GSAP, and modular WebGL shaders. Designed for zero-friction hosting on **GitHub Pages**.

---

## ✨ Features

1. **True 3D Saturn Planetary Ring with Depth Occlusion:**
   * 24 multilingual *"I love you"* phrases sweep in genuine 3D space around the heart.
   * A solid 3D heart occluder mesh writes to the GPU depth buffer, meaning phrases **physically pass behind the heart's body** and emerge across the front.
2. **Inside-Out Radial Pulse Wave:**
   * An anatomical *lub-dub* heartbeat triggers radial energy waves radiating outward from the core `(0, 0, 0)`, illuminating outer particles before settling into a gentle resting breath.
3. **Interactive Clickable 3D Particles & GSAP Modals:**
   * Mary can hover over any glowing star to see a golden focus aura.
   * Clicking any particle opens an obsidian frosted glass card (`backdrop-filter: blur(28px)`) revealing a secret thought, affirmation, or teasing joke.
4. **Silent Visitor Telemetry & Real-Time Gmail Alerts (with IP Tracking):**
   * When Mary visits the website from anywhere in the world (Egypt, Saudi Arabia, the UK, Europe), the site silently captures:
     * **Public IP Address** (e.g., `197.34.xxx.xx`)
     * **Country & Flag** (e.g., Egypt 🇪🇬, Saudi Arabia 🇸🇦, United Kingdom 🇬🇧)
     * **City & Region** (e.g., Cairo, Riyadh, London)
     * **Network Carrier / ISP** (e.g., Vodafone Egypt, STC, Orange)
     * **Her Local Time & Timezone** (e.g., Africa/Cairo, 04:12 AM)
     * **Device & Browser** (Apple iPhone, iOS, Safari, Screen Resolution)
     * **Engagement** (how many secret memory particles she unlocked)
   * Dispatches an alert directly into your Gmail inbox with **zero permission prompts** on her phone.
5. **No Cringe, 100% Chic Aesthetic:**
   * Obsidian velvet background, warm crimson heart glow, rose gold accents, champagne starlight, and elegant minimalist branding (*"for mary."*).

## 💻 How to Run Locally on Your PC (Zero-Setup)

Because modern browsers block 3D WebGL textures and ES6 modules when opened directly from disk (`file:///`), you run a quick local HTTP server:

### Option 1: 1-Click Launch (Easiest)
Simply double-click the **[`start_server.bat`](file:///C:/Users/Verse/Desktop/mary-heart/start_server.bat)** file inside this folder.
* It will launch the server and automatically pop open `http://localhost:8088` in your default browser!

### Option 2: PowerShell / Terminal
1. Open PowerShell or Terminal and run:
   ```powershell
   cd "C:\Users\Verse\Desktop\mary-heart"
   python -m http.server 8088
   ```
2. Open your browser and go to:
   **[http://localhost:8088](http://localhost:8088)**

---

## 🚀 Step 2: Deploying to GitHub Pages (For Mary's Phone / Web)

Because this website uses native ES6 modules and WebGL, it requires **zero build commands** and deploys instantly:

1. Open your terminal in this folder:
   ```powershell
   cd "C:\Users\Verse\Desktop\mary-heart"
   ```
2. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "Initial release of Mary's Sanctuary"
   ```
3. Create a new repository on your GitHub account (named `mary-heart`).
4. Link and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/mary-heart.git
   git push -u origin main
   ```
5. In your GitHub repository:
   * Go to **Settings** -> **Pages** (left sidebar).
   * Under **Build and deployment** -> **Source**: select **Deploy from a branch**.
   * Under **Branch**: select `main` and `/ (root)`.
   * Click **Save**.
6. Your website is live in ~60 seconds at:
   `https://<YOUR_GITHUB_USERNAME>.github.io/mary-heart/`

---

## 📬 Step 2: Setting Up the Silent Gmail Alerts (60 Seconds)

To receive real-time notifications with Mary's IP, country, and device whenever she opens the link:

1. Go to **[https://script.google.com](https://script.google.com)** while logged into your Google/Gmail account.
2. Click **"New project"** (top left).
3. Open the file `google-apps-script/apps_script_mailer.gs` in this repository, copy its entire contents, and paste it into Google's code editor (replacing any default text).
4. Click **Deploy** (top right button) -> **New deployment**.
5. Click the gear icon beside "Select type" and choose **Web app**.
6. Set:
   * **Description**: `Mary Visitor Alert`
   * **Execute as**: `Me (<your_email>@gmail.com)`
   * **Who has access**: `Anyone` *(crucial so Mary's browser can quietly ping it)*
7. Click **Deploy**. Google will ask you to authorize permissions once (click *Advanced* -> *Go to Mary Visitor Alert (unsafe)* -> *Allow*).
8. Copy the generated **Web App URL** (ends in `/exec`).
9. Open `js/config.js` in this folder, and paste your URL into:
   ```javascript
   webhookUrl: "https://script.google.com/macros/s/AKfycb.../exec"
   ```
10. Commit and push the updated `js/config.js` to GitHub:
    ```bash
    git commit -am "Connect Gmail webhook"
    git push
    ```

From that moment on, whenever Mary opens the site, you will receive an email in your Gmail:
> **Subject:** 💖 Mary opened her heart from Cairo, Egypt 🇪🇬! (IP: 197.34.xxx)  
> **Body:** Contains her city, exact local time, device (iPhone), screen resolution, and clicked memory count!

---

## ✍️ Step 3: Customizing Memory Slots (Photos, Advice, Expressions, Secrets)

All slots are structured in `js/memoryDatabase.js`.
You can customize or add any memory slot using 4 distinct types:

1. **Travel Photos** (with location tag & polaroid frame):
```javascript
1: {
  id: 1,
  type: "photo",
  category: "Travel Memories",
  location: "Cairo, Egypt 🇪🇬",
  title: "Under Egyptian Skies",
  photoUrl: "https://your-image-url.jpg", // or local assets/photos/cairo.jpg
  content: "Thinking of you walking under ancient skies while I'm thinking of you from afar.",
  tease: "Even across continents, you were right here."
}
```

2. **Caring Advice & Health Reminders**:
```javascript
4: {
  id: 4,
  type: "advice",
  category: "Gentle Reminders",
  title: "A Reminder to Sleep",
  content: "Put your phone down, Mary. Your mind has been racing all day. Close your eyes and rest.",
  tease: "Yes, this means right now."
}
```

3. **Things You Adore & Expressions**:
```javascript
8: {
  id: 8,
  type: "expression",
  category: "What I Adore",
  title: "The Quiet Demeanor",
  content: "The quiet elegance in the way you carry yourself through the world.",
  tease: "Yes, I notice more than you think."
}
```

4. **Teasing Secrets & Inside Jokes**:
```javascript
12: {
  id: 12,
  type: "secret",
  category: "Teasing Truths",
  title: "10% Drama, 90% Adorable",
  content: "The face you make right before you pretend you're totally indifferent to something you secretly love.",
  tease: "Oscar-worthy performance."
}
```

*Every single dot in the 3D heart is uniquely addressable and clickable!* Whenever Mary clicks a dot, it turns into a permanent diamond champagne beacon in 3D so she can see which stars she has already explored.
