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
- Volunteer form: [Google Form](https://docs.google.com/forms/d/e/1FAIpQLScAgWgiWEjMm5N5HO9f-kF5_MNCsFu0AjfF9-sFnWGYdJG7Jg/viewform)
