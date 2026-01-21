# 🎨 Real-Time Collaborative Drawing Canvas

A real-time, multi-user collaborative drawing application built using **HTML5 Canvas**, **Node.js**, and **Socket.io**.  
Multiple users can draw simultaneously on a shared canvas with live synchronization, undo/redo, and conflict-safe state management.

---

## 🚀 Live Demo

🔗 **Application URL:**  
https://collaborative-canvas-on22.onrender.com

---

## 🎥 Demo Video

📽️ **Watch Demo:**  
https://drive.google.com/file/d/1HGQAJRpRWGFFu1fIHia3bi9Ckdt-4VVt/view?usp=sharing

> The video demonstrates real-time drawing across multiple tabs, undo/redo synchronization, and clear-all behavior.

---

## ✨ Features

- Real-time collaborative drawing
- Brush & eraser tools
- Color and stroke size selection
- Server-authoritative undo / redo
- Clear canvas (global)
- DPI-safe and resize-safe canvas rendering
- Deterministic redraw using stroke replay

---

## 🛠 Tech Stack

- **Frontend:** HTML5 Canvas, Vanilla JavaScript
- **Backend:** Node.js, Express
- **Real-Time:** Socket.io (WebSockets)
- **Deployment:** Render

---

## ▶️ Run Locally

```bash
git clone https://github.com/YOUR-USERNAME/collaborative-canvas.git
cd collaborative-canvas
npm install
npm start
