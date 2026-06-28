# InAmigos Foundation — Website

Static website for **InAmigos Foundation**, a Section 8 registered non-profit based in Chhattisgarh, India. Founded on September 23, 2020 by Mr. Govind Shukla, the foundation works across food relief, education, women empowerment, animal welfare, environmental sustainability, and skill development.

---

## Pages

| File | Description |
|---|---|
| `index.html` | Homepage — hero, impact highlights, project overview, and CTA |
| `about.html` | Foundation story, focus areas, certifications, and values |
| `initiatives.html` | Detailed view of all six ongoing project streams |
| `volunteer.html` | How to get involved — volunteering, donating, and partnering |

---

## Projects

| Project | Focus |
|---|---|
| **Seva** | Food and clothing support for underserved families |
| **Bachpanshala** | Education access and digital literacy for children |
| **Jeev** | Animal rescue, feeding, and protection |
| **Udaan** | Women empowerment through skills and awareness |
| **Prakriti** | Environmental conservation and sustainability |
| **Vikas** | Employability and skill development for youth |

---

## Tech stack

- Plain HTML5 and CSS3 — no frameworks, no build step
- Single stylesheet: `style.css`
- Hosted images via Unsplash (no local assets required)
- Google Fonts not used — system serif/sans stack for fast load

---

## Structure

```
Work_1/
├── index.html
├── about.html
├── initiatives.html
├── volunteer.html
├── style.css
└── README.md
```

---

## Running locally

Open any `.html` file directly in a browser — no server required.

```bash
# Optional: serve with any static server
npx serve .
# or
python -m http.server 8080
```

---

## Design system

All design tokens are defined as CSS custom properties in `:root` inside `style.css`:

| Token | Purpose |
|---|---|
| `--accent` / `--accent-dark` | Primary brand brown |
| `--green` / `--green-dark` | CTA and impact band greens |
| `--bg` / `--card` | Page and card backgrounds |
| `--font-serif` / `--font-sans` | Typography stacks |
| `--shadow-sm/md/lg` | Layered shadow scale |
| `--radius-card` / `--radius-inner` | Border radius scale |

---

## Accreditations

- Section 8 registered (Central Government)
- 80G & 12A certified (tax exemptions)
- CSR-1 registered (corporate partnership eligible)
- NITI Aayog registered
- ISO 9001:2015 certified

---

## Contact & social

- Email: [inamigosfoundation@gmail.com](mailto:inamigosfoundation@gmail.com)
- Facebook: [facebook.com/inamigos](https://www.facebook.com/inamigos)
- Twitter: [twitter.com/InamigosF](https://www.twitter.com/InamigosF)
- Instagram: [instagram.com/inamigos](https://www.instagram.com/inamigos)
- LinkedIn: [linkedin.com/company/inamigos-foundation](https://www.linkedin.com/company/inamigos-foundation)
- Volunteer form: [Google Form](https://docs.google.com/forms/d/e/1FAIpQLScAgWgiWEjMm5N5HO9f-kF5_MNCsFu0AjfF9-sFnWGYdJG7Jg/viewform)

---

## Newsletter signup

The footer on every page includes a newsletter subscription form. It submits to [Formspree](https://formspree.io) — a free, static-site-friendly form backend that requires no server.

**To activate it:**

1. Create a free account at [formspree.io](https://formspree.io)
2. Create a new form and copy the form ID (looks like `xabc1234`)
3. In `main.js`, replace `YOUR_FORM_ID` in the fetch URL:

```js
// Before
'https://formspree.io/f/YOUR_FORM_ID'

// After
'https://formspree.io/f/xabc1234'
```

Formspree will forward submissions to the email address on your account. The free tier allows 50 submissions/month.

---

## Social feed

The homepage includes a static Instagram-style photo feed (`social-feed-section`) as a visual placeholder. It does not fetch live data.

**To replace it with a real live feed:**

Option A — **EmbedSocial** (recommended, free tier available):
1. Sign up at [embedsocial.com](https://embedsocial.com)
2. Connect your Instagram Business account
3. Copy the embed `<div>` + `<script>` snippet they provide
4. Replace the entire `.social-feed-grid` div in `index.html` with the EmbedSocial widget code

Option B — **Elfsight**:
1. Sign up at [elfsight.com](https://elfsight.com)
2. Build an Instagram Feed widget and copy the embed code
3. Same replacement as above — swap `.social-feed-grid` for the widget div

Option C — **Instagram Basic Display API** (self-hosted, requires developer setup):
- Requires a Facebook Developer App, access token management, and a small backend or serverless function to refresh tokens
- Not recommended for a purely static site without a deployment pipeline

---

## Partnerships

Partner tiles on the homepage use abbreviated placeholder logos. To add real partner logos:

1. Add SVG or PNG assets to a `/assets/partners/` directory
2. Replace the `.partner-logo-wrap` contents with `<img>` tags:

```html
<div class="partner-logo-wrap">
  <img src="assets/partners/tcs.svg" alt="Tata Consultancy Services logo" width="40">
</div>
```

Keep images under 20 KB each (SVG preferred for crispness at any size).
