Great idea. Here’s an updated README.md that includes a “What’s Completed” section summarizing the major improvements you’ve shipped so far, aligned to your roadmap. I also wove completion badges into relevant sections so new contributors see the current state at a glance.

You can paste this over your existing README and adjust dates as needed.

```markdown
<h1 align="center">🌲 Welcome to Outdoorsy 👋</h1>

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-1.0.0-blue.svg?cacheSeconds=2592000" />
  <img src="https://img.shields.io/badge/status-actively%20maintained-brightgreen" />
  <img src="https://img.shields.io/badge/accessibility-WCAG%202.1%20AA-blueviolet" />
  <img src="https://img.shields.io/badge/tests-in%20progress-yellow" />
  <a href="https://github.com/joshl26/Outdoorsy#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/joshl26/Outdoorsy/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/joshl26/Outdoorsy/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/joshl26/Outdoorsy" />
  </a>
</p>

<p align="center">
  Outdoorsy is a <strong>full‑stack web application</strong> where users discover, review, and share campsites worldwide.<br />
  Live at <a href="https://joshlehman.ca/outdoorsy" target="_blank"><strong>joshlehman.ca/outdoorsy</strong></a> · API Docs at <a href="https://outdors.ca/api-docs/" target="_blank"><strong>outdors.ca/api-docs</strong></a>
</p>

---

## ✅ What’s Completed (Highlights)

The following improvements have been shipped recently, mapped to our public roadmap.

- Architecture and Code Quality
  - Modularized configuration (`config/` for db, session, passport, security/helmet, swagger).
  - Centralized middleware exports (`middleware/index.js`).
  - Validation and auth middleware extracted (Joi + Passport guards).
  - `app.js` refactored to minimal bootstrap (< 50 lines target).

- Error Handling and Developer Experience
  - Unified error classes (`AppError`, `ValidationError`, `AuthenticationError`, `NotFoundError`).
  - Centralized error handler with user-friendly messages and dev-mode stack traces.
  - Flash messages modernized (Bootstrap 5 close button, aria-live region).

- Frontend Accessibility and Semantics
  - Correct heading hierarchy across EJS views (home, index, show, nearby, new, edit, favorites).
  - Semantic sections with `aria-labelledby`, visually hidden headings where appropriate.
  - Accessible navbar/footer: roles, landmarks, keyboard navigation, SVG icons labelled.
  - Forms grouped with `<fieldset>`/`<legend>`, labels/ids properly associated.
  - Focus styles, skip links, and improved contrast.

- UI/UX and Styling
  - Homepage rebuilt: immersive hero, features, stats, CTA; responsive and performant.
  - New `public/stylesheets/` organization: `home.css`, `users-register.css`, `error.css`, `success.css`, `navbar.css`, `footer.css`.
  - Removed inline styles from EJS; consistent button and input styling.
  - IntersectionObserver-based staggered reveal animations respecting reduced motion.

- Performance
  - MongoDB indexes added on Campground, Review, User.
  - Pagination added to campgrounds and reviews.
  - Lazy-loading images and responsive layout optimizations.
  - Parallax disabled on small screens to avoid jank.

- Security
  - Rate limiting on auth and API routes.
  - CSRF protection across forms (`csurf`) with token injection.
  - Request body size limits and environment variable validation.
  - Hardened Helmet CSP and security headers audit baseline.
  - Security documentation and incident response plan drafted.

- Documentation
  - README overhauled: features, tech stack, structure, env setup, screenshots.
  - Roadmap published with phases and acceptance criteria.
  - Live Swagger UI hosted and linked.

See the full roadmap for in‑progress and upcoming items.

---

## 🚀 Features

- Explore all campgrounds and reviews without login
- Create, edit, and delete your own campgrounds and reviews (auth required)
- Secure authentication and authorization with PassportJS
- Image handling and storage on AWS
- Nearby discovery, gallery, and review system
- Swagger‑powered API documentation

---

## 🧠 Tech Stack

| Layer | Technologies |
|------|---------------|
| Frontend | HTML5, CSS3, Bootstrap 5 |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose, hosted on AWS EC2) |
| Auth | PassportJS |
| Security | Helmet, Joi, csurf, express‑rate‑limit |
| Docs | Swagger‑UI / JSDoc |
| Deploy | Render.com, AWS |
| Architecture | REST + MVC, SSR with EJS |

---

## 🧭 Live Resources

- Website: https://joshlehman.ca/outdoorsy
- API Docs (Swagger): https://joshlehman.ca/outdoorsy/api-docs/

---

## 🖼️ Screenshots

| Home | All Campgrounds | Campground Details | Login/Register |
|:----:|:----------------:|:------------------:|:---------------:|
| ![Home](https://raw.githubusercontent.com/joshl26/joshl26/main/assets/Outdoorsy_1.png) | ![All](https://raw.githubusercontent.com/joshl26/joshl26/main/assets/Outdoorsy_2.png) | ![Details](https://raw.githubusercontent.com/joshl26/joshl26/main/assets/Outdoorsy_4.png) | ![Login](https://raw.githubusercontent.com/joshl26/joshl26/main/assets/Outdoorsy_3.png) |

API Demo & UMLs
- ![Swagger Endpoints](https://raw.githubusercontent.com/joshl26/joshl26/main/assets/Outdoorsy-Swagger-UI.png)
- ![Swagger Schemas](https://raw.githubusercontent.com/joshl26/joshl26/main/assets/Outdoorsy-Swagger-UI-1.png)
- ![UML Sequence Diagram](https://raw.githubusercontent.com/joshl26/joshl26/main/assets/Outdoorsy-sequence-diagram.png)

---

## 🏗️ Project Structure

```text
Outdoorsy/
├─ app.js                         # Express app setup
├─ server.js                      # Server bootstrap
├─ config/
│  ├─ db.js                       # Mongoose connection
│  ├─ session.js                  # Session configuration
│  ├─ passport.js                 # Passport strategies
│  ├─ security.js                 # Helmet/CSP and headers
│  └─ swagger.js                  # Swagger config
├─ routes/
│  ├─ campgrounds.js
│  ├─ reviews.js
│  ├─ users.js
│  └─ api/
│     └─ v1/                      # Swagger-annotated endpoints
├─ controllers/
│  ├─ campgrounds.controller.js
│  ├─ reviews.controller.js
│  └─ users.controller.js
├─ models/
│  ├─ Campground.js
│  ├─ Review.js
│  └─ User.js
├─ middleware/
│  ├─ index.js                    # Re-exports
│  ├─ auth.js                     # isLoggedIn, ownership checks
│  ├─ validation.js               # Joi validators
│  └─ errors.js                   # Error handler and async wrapper
├─ public/
│  ├─ javascripts/
│  │  └─ home.js                  # IntersectionObserver/stagger reveals
│  └─ stylesheets/
│     ├─ main.css
│     ├─ home.css
│     ├─ navbar.css
│     ├─ footer.css
│     ├─ users-register.css
│     ├─ error.css
│     └─ success.css
└─ views/
   ├─ layouts/boilerplate.ejs
   ├─ partials/{navbar,footer,flash}.ejs
   ├─ campgrounds/{index,show,new,edit,nearby}.ejs
   ├─ users/{login,register,success}.ejs
   ├─ favorites.ejs
   ├─ home.ejs
   └─ error.ejs
```

---

## ⚙️ Environment Setup

Create `.env`:

```bash
# App
NODE_ENV=development
PORT=3000
BASE_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/outdoorsy

# Storage / CDN (example: Cloudinary)
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

## 🔐 Security Posture

- Rate limiting on auth and API
- CSRF tokens on all forms
- Strict CSP and Helmet headers
- Joi input validation for all critical paths
- Request size limits
- Env var schema validation on startup
- Incident response and security best practices documented

---

## ♿ Accessibility

- WCAG 2.1 AA-aligned structure and color contrast
- Proper heading hierarchy (h1-h2-h3 per page region)
- Landmarks (`<main>`, `<header>`, `<footer>`)
- Keyboard‑accessible navigation and controls
- Focus states and skip links
- `aria-live` for flash messages and errors

---

## 🧭 Roadmap Snapshot

- Done: foundation, security controls, accessibility overhaul, performance basics, documentation refresh
- In Progress: compression, image optimization pipeline, caching/CDN, SEO metadata, Swagger endpoint coverage
- Planned: user profiles, favorites/bookmarks, advanced search/filters, API v1 with JWT, monitoring & CI observability

Full roadmap: see ROADMAP.md

---

## 👤 Author

**Joshua Lehman**
- Portfolio: https://joshlehman.ca
- GitHub: https://github.com/joshl26
- LinkedIn: https://www.linkedin.com/in/joshrlehman/

---

## 🤝 Contributing

Issues and PRs welcome.  
- Issues: https://github.com/joshl26/Outdoorsy/issues  
- Contributing Guide: https://github.com/joshl26/Outdoorsy/blob/master/CONTRIBUTING.md

---

## 📝 License

MIT © 2023–2025 [Joshua Lehman](https://github.com/joshl26)
```

Want me to also generate a concise “Changelog” section from the roadmap’s completed items with dates and PR links? It helps keep releases tidy and makes your progress obvious to visitors.