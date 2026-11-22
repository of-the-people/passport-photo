# 📸 Passport Photo Grid Generator (4x6 Inch Print)

A modern, responsive, zero-dependency Single Page Application (SPA) designed to be hosted on **GitHub Pages (`github.io`)**.

This tool lets users open a photo from their phone or computer, crop it into a **2" × 2" (51 × 51 mm) square**, duplicate it into **6 identical copies arranged in a 2-row by 3-column grid**, and save the entire sheet as a **4" × 6" photo print** named **`4x6inch.jpg`** ready for standard 300 DPI photo printing.

---

## ✨ Features

- **🔒 100% Client-Side & Private**: All image processing, cropping, and grid generation happens entirely inside your browser's canvas. No images are ever sent over the internet or uploaded to any server.
- **📱 Mobile & Desktop Friendly**:
  - Open images from your computer or phone library (`Browse Files`).
  - Take a photo directly using your phone's camera (`Take Photo`).
  - Drag and drop image files anywhere.
  - Paste directly from clipboard (<kbd>Ctrl</kbd> + <kbd>V</kbd> / <kbd>Cmd</kbd> + <kbd>V</kbd>).
  - Built-in sample portrait to test instantly without uploading.
- **✂️ Interactive 2" × 2" Square Cropper**:
  - Intuitive touch gestures: **pinch-to-zoom** and **touch-drag** on mobile.
  - Mouse wheel zoom and click-and-drag panning on desktop.
  - Zoom slider with quick `-` and `+` buttons.
  - 90° quick rotation (clockwise & counter-clockwise) and horizontal flip.
  - **Fine Tilt Slider (-15° to +15°)**: Perfect for straightening slightly tilted head poses.
  - Optional lighting adjustments: Brightness, Contrast, and Saturation sliders.
- **📏 Official Passport Alignment Guides**:
  - **Passport Guide**: Based on US Department of State & ICAO specifications:
    - Crown maximum and minimum guidelines (head between 1" and 1 3/8" from chin to crown).
    - Eye level guideline (56% to 68% from bottom).
    - Chin guideline and head oval silhouette.
    - Vertical symmetry axis.
  - **Rule of Thirds 3×3 Grid** & **Center Crosshair** overlays.
- **🖨️ 4" × 6" Grid Sheet (2 Rows × 3 Columns = 6 Copies)**:
  - 3 columns × 2 inches = **6 inches wide**.
  - 2 rows × 2 inches = **4 inches tall**.
  - Fits standard **4×6 inch (10×15 cm)** photo paper border-to-border.
  - Real-time live preview that updates as you pan, zoom, or rotate.
  - Cutting guide line options: **Thin Dashed Lines** (easiest for scissors), **Corner Tick Marks**, or **Seamless**.
- **💾 Export & Print**:
  - **Download `4x6inch.jpg`**: Exports at **300 DPI (1800 × 1200 px)** or ultra-high **600 DPI (3600 × 2400 px)** with standard **JFIF 300 DPI metadata headers** injected directly into the JPEG binary so photo kiosks and printers recognize the print size.
  - **Download Single 2×2"**: Option to save a single 2x2 inch square photo (`2x2inch.jpg`).
  - **Direct Print**: Built-in print stylesheet (`@page { size: 6in 4in landscape; margin: 0; }`) for direct photo printing.

---

## 🚀 How to Host on GitHub Pages (`github.io`)

This application is completely static (HTML, CSS, JavaScript) and requires **no build step**, **no Node.js**, and **no server**. It works straight out of the box on GitHub Pages:

### Step 1: Initialize Git and Push to GitHub

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit of Passport Photo Grid SPA"

# Create a repo on GitHub (e.g. passport-photo) and push
git remote add origin https://github.com/<your-username>/passport-photo.git
git branch -M main
git push -u origin main
```

### Step 2: Enable GitHub Pages in Repository Settings

1. Open your repository on GitHub.
2. Go to **Settings** (tab at the top).
3. In the left sidebar, click **Pages**.
4. Under **Build and deployment > Source**, select:
   - **Deploy from a branch**
   - Branch: `main`
   - Folder: `/ (root)`
5. Click **Save**.

Within ~1 minute, your app will be live at:
```
https://<your-username>.github.io/passport-photo/
```

*(Note: The included `.nojekyll` file ensures GitHub Pages serves all static assets without Jekyll processing.)*

---

## 💻 Local Testing & Development

To test the application locally on your machine, simply run any static HTTP server. For example:

### Using Python:
```bash
python3 -m http.server 8080
```
Then open [http://localhost:8080](http://localhost:8080) in your web browser.

---

## 💡 How to Save Big at Walgreens, CVS, or Walmart

Most pharmacy and retail photo counters charge **$15.00 to $17.99** for two printed passport photos.

With this tool:
1. Save the generated **`4x6inch.jpg`** to your phone or computer.
2. Visit Walgreens Photo, CVS Photo, Walmart Photo, Target Photo, or Shutterfly.
3. Order a standard **4×6 inch photo print** (typically costs **$0.30 to $0.40**).
4. **DO NOT** select the "Passport Photo" option on their website or kiosk—simply choose regular 4×6 photo print!
5. Pick up your 4×6 print and cut along the lines with scissors to get **6 official 2" × 2" passport photos** for under 40 cents!

---

## 📋 US & International Passport Photo Rules Checklist

| Requirement | Specification |
|---|---|
| **Dimensions** | 2 × 2 inches (51 × 51 mm) square |
| **Print Sheet** | 4 × 6 inches (102 × 152 mm) containing 6 photos |
| **Head Height** | Chin to top of hair must measure between 1" and 1 3/8" (25 mm to 35 mm / 50% to 69% of height) |
| **Eye Level** | Between 1 1/8" and 1 3/8" (28 mm to 35 mm) from the bottom of the photo |
| **Background** | Plain white or off-white background with no patterns or shadows |
| **Expression** | Neutral facial expression or natural smile, both eyes open |
| **Attire** | Everyday clothing; no uniforms, hats, or headphones |
| **Eyeglasses** | Eyeglasses must not be worn (per US State Dept rules) |

---

## 📂 File Structure

```
├── index.html           # Main semantic single page app markup
├── style.css            # Responsive, theme-aware stylesheet with print styles
├── app.js               # Canvas cropping engine, gesture handling, and 300 DPI export
├── favicon.svg          # Vector icon for browser tab
├── sample-portrait.svg  # Sample vector portrait for instant one-click testing
├── .nojekyll            # Bypass Jekyll processing on GitHub Pages
└── README.md            # Documentation and deployment instructions
```

---

## 📄 License

MIT License. Free and open source for personal or commercial use.
