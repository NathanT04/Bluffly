<<<<<<< HEAD
# Bluffly
=======
# Bluffly Homepage (Prototype)

A sleek, poker-themed homepage built with **React + Vite** and **Tailwind CSS**. 
The design matches your requested layout: a centered pill-style navigation bar, 
a hero section on the left, and a poker table image on the right half.

## ✨ Features
- Dark gray/black theme with tasteful red accents (casino vibes).
- Right-half poker image with gradient for legibility.
- Accessible, keyboard-focusable navigation.
- Tabs implemented as separate, documented React components.
- Clean component structure, easy to wire to a router later.

## 🗂 Project Structure
```text
bluffly-homepage/
├─ index.html
├─ package.json
├─ postcss.config.js
├─ tailwind.config.js
├─ vite.config.js
├─ src/
│  ├─ index.css
│  ├─ main.jsx
│  ├─ pages/
│  │  └─ Homepage.jsx            # Page layout + hero + image
│  └─ components/
│     ├─ NavBar.jsx              # Centered pill nav, handles active tab
│     └─ tabs/
│        ├─ HomeTab.jsx
│        ├─ SimulationTab.jsx
│        ├─ AnalyzerTab.jsx
│        └─ LessonsTab.jsx
```

## 🚀 Getting Started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Run the dev server**
   ```bash
   npm run dev
   ```
3. Open the printed local URL in your browser.

## 🧰 Tech Notes
- **Styling:** Tailwind CSS. See `tailwind.config.js` and `src/index.css`.
- **Build Tool:** Vite for fast dev + HMR.
- **Accessibility:** Tabs are semantic buttons and expose `aria-current` on active item.

## 🔧 Customization
- **Change the poker image:** Edit the `img` `src` in `src/pages/Homepage.jsx`.
- **Swap colors:** Adjust utility classes on the page wrapper gradients and nav styles.
- **Router-ready:** Replace the tab state with React Router links when you add real pages.

## 📄 License
MIT — use however you like.
>>>>>>> 3ae1357 (Add Bluffly homepage prototype)
