### 🌲 Welcome to Outdoorsy 👋

<p align="center">
  <a href="https://github.com/joshl26/Outdoorsy#readme" target="_blank">
    <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  </a>
  <img alt="Status" src="https://img.shields.io/badge/status-actively%20maintained-brightgreen" />
  <img alt="Accessibility" src="https://img.shields.io/badge/accessibility-WCAG%202.1%20AA-blueviolet" />
  <img alt="Tests" src="https://img.shields.io/badge/tests-in%20progress-yellow" />
  <a href="https://github.com/joshl26/Outdoorsy/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/joshl26/Outdoorsy/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/joshl26/Outdoorsy" />
  </a>
</p>

Outdoorsy is a full‑stack web application where users discover, review, and share campsites worldwide.  
Live: [joshlehman.ca/outdoorsy](https://joshlehman.ca/outdoorsy) · API Docs: [joshlehman.ca/outdoorsy/api-docs](https://joshlehman.ca/outdoorsy/api-docs/)

---

### ✅ What’s Completed (Highlights)

Recent improvements mapped to the public roadmap:

- Architecture & Code Quality
  - Modular `config/` (db, session, passport, security, swagger).
  - Centralized middleware exports (`middleware/index.js`).
  - Joi validation and Passport auth middleware.
  - `app.js` refactored to minimal bootstrap.

- Error Handling & Developer Experience
  - Unified error classes (`AppError`, `ValidationError`, etc.).
  - Centralized error handler with dev stack traces.
  - Modernized flash messages (Bootstrap 5, aria-live).

- Frontend Accessibility & Semantics
  - Correct heading hierarchy in views.
  - Landmarks, keyboard navigation, labelled SVG icons.
  - Forms with `<fieldset>`/`<legend>`, properly associated labels.
  - Focus styles, skip links, staggered reveal animations respecting reduced motion.

- UI/UX & Styling
  - Responsive homepage with features, stats, CTA.
  - Organized `public/stylesheets/` (home, navbar, footer, etc.).
  - Removed inline styles; consistent button/input styling.

- Performance
  - MongoDB indexes on key models.
  - Pagination for campgrounds and reviews.
  - Lazy-loaded images and responsive layout improvements.

- Security
  - Rate limiting for auth and API routes.
  - CSRF protection on forms (`csurf`).
  - Hardened CSP via Helmet; request size limits and env validation.

- Documentation
  - README overhauled, roadmap published, Swagger UI hosted.

See the full roadmap for in‑progress and upcoming items.

---

### 🚀 Features

- Browse campgrounds and reviews without logging in
- Create, edit, delete campgrounds and reviews (auth required)
- Secure authentication & authorization with PassportJS
- Image handling and storage on AWS/Cloudinary
- Nearby discovery, gallery, and review system
- Swagger-powered API documentation

---

### 🧠 Tech Stack

| Layer        | Technologies                           |
| ------------ | -------------------------------------- |
| Frontend     | HTML5, CSS3, Bootstrap 5               |
| Backend      | Node.js, Express.js                    |
| Database     | MongoDB (Mongoose)                     |
| Auth         | PassportJS                             |
| Security     | Helmet, Joi, csurf, express-rate-limit |
| Docs         | Swagger‑UI / JSDoc                     |
| Deploy       | Render.com, AWS                        |
| Architecture | REST + MVC, SSR with EJS               |

---

### 🧭 Live Resources

- Website: [joshlehman.ca/outdoorsy](https://joshlehman.ca/outdoorsy)  
- API Docs (Swagger): [joshlehman.ca/outdoorsy/api-docs](https://joshlehman.ca/outdoorsy/api-docs/)

---

### 🖼️ Screenshots

Home | All Campgrounds | Campground Details | Login/Register
:---:|:---:|:---:|:---:
![Home](https://raw.githubusercontent.com/joshl26/joshl26/main/assets/Outdoorsy_1.png) | ![All](https://raw.githubusercontent.com/joshl26/joshl26/main/assets/Outdoorsy_2.png) | ![Details](https://raw.githubusercontent.com/joshl26/joshl26/main/assets/Outdoorsy_4.png) | ![Login](https://raw.githubusercontent.com/joshl26/joshl26/main/assets/Outdoorsy_3.png)

API & UMLs:

- Swagger Endpoints: ![Swagger Endpoints](https://raw.githubusercontent.com/joshl26/joshl26/main/assets/Outdoorsy-Swagger-UI.png)  
- Swagger Schemas: ![Swagger Schemas](https://raw.githubusercontent.com/joshl26/joshl26/main/assets/Outdoorsy-Swagger-UI-1.png)  
- UML Sequence Diagram: ![UML](https://raw.githubusercontent.com/joshl26/joshl26/main/assets/Outdoorsy-sequence-diagram.png)

---

### 🏗️ Project Structure

```
Outdoorsy/
├─ app.js
├─ server.js
├─ config/
│  ├─ db.js
│  ├─ session.js
│  ├─ passport.js
│  ├─ security.js
│  └─ swagger.js
├─ routes/
│  ├─ campgrounds.js
│  ├─ reviews.js
│  ├─ users.js
│  └─ api/v1/
├─ controllers/
│  ├─ campgrounds.controller.js
│  ├─ reviews.controller.js
│  └─ users.controller.js
├─ models/
│  ├─ Campground.js
│  ├─ Review.js
│  └─ User.js
├─ middleware/
│  ├─ index.js
│  ├─ auth.js
│  ├─ validation.js
│  └─ errors.js
├─ public/
│  ├─ javascripts/home.js
│  └─ stylesheets/
│     ├─ main.css
│     ├─ home.css
│     ├─ navbar.css
│     └─ ...
└─ views/
   ├─ layouts/boilerplate.ejs
   ├─ partials/{navbar,footer,flash}.ejs
   ├─ campgrounds/{index,show,new,edit,nearby}.ejs
   └─ users/{login,register,success}.ejs
```

---

### ⚙️ Environment Setup

Create a `.env` file (example):

```bash
# App
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/outdoorsy

# Storage / CDN (Cloudinary example)
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_KEY=your-key
CLOUDINARY_SECRET=your-secret

# Sessions & Auth
SESSION_SECRET=supersecretkey
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_CALLBACK_URL=/auth/google/callback
```

Install and run:

```bash
npm install
npm start
```

Run tests:

```bash
npm test
```

---

### 🔐 Security Posture

- Rate limiting on auth & API
- CSRF tokens on forms
- Strict CSP and Helmet headers
- Joi validation for critical paths
- Request size limits and env var validation
- Incident response & security documentation

---

### ♿ Accessibility

- Designed to WCAG 2.1 AA standards
- Proper heading hierarchy and landmarks
- Keyboard-accessible navigation and controls
- Focus states, skip links, and `aria-live` for dynamic messages

---

### 🧭 Roadmap Snapshot

- Done: foundation, security controls, accessibility overhaul, documentation refresh  
- In Progress: image optimization pipeline, caching/CDN, SEO metadata  
- Planned: user profiles, bookmarks/favorites, advanced search, API v1 (JWT), monitoring & CI observability

See `ROADMAP.md` for full details.

---

### 👤 Author

Joshua Lehman  

- Portfolio: [joshlehman.ca](https://joshlehman.ca)  
- GitHub: [joshl26](https://github.com/joshl26)  
- LinkedIn: [Joshua Lehman](https://www.linkedin.com/in/joshrlehman/)

---

### 🤝 Contributing

Issues and PRs welcome.

- Issues: [github.com/joshl26/Outdoorsy/issues](https://github.com/joshl26/Outdoorsy/issues)  
- Contributing Guide: [CONTRIBUTING.md](https://github.com/joshl26/Outdoorsy/blob/master/CONTRIBUTING.md)

---

### 📝 License

MIT © 2023–2025 Joshua Lehman — see [LICENSE](https://github.com/joshl26/Outdoorsy/blob/master/LICENSE)

---
