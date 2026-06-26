# [CHK] NO FACE CLAN - Credit Card Checker

A professional credit card verification terminal with cyberpunk aesthetics. Built with React 19, Vite 6, TypeScript, and Tailwind CSS 4.

## Features

- **Luhn Algorithm Validation** - Real credit card number validation
- **Card Type Detection** - Visa, Mastercard, Amex, Discover, JCB
- **Live/Dead Status** - Realistic probability-based card verification
- **Matrix Rain Effect** - Animated canvas background
- **Glitch Text Effects** - Cyberpunk-style text animations
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Session Statistics** - Track live/dead percentages

## Tech Stack

- React 19
- Vite 6
- TypeScript 5
- Tailwind CSS 4
- Zustand (State Management)
- Framer Motion (Animations)
- Lucide React (Icons)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment to Render

1. Push to GitHub repository
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New" → "Static Site"
4. Connect your GitHub repository
5. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
6. Deploy

## Project Structure

```
checker/
├── src/
│   ├── app/           # App configuration
│   ├── features/      # Feature-based modules
│   │   └── checker/   # Card checker logic
│   ├── widgets/       # Composite components
│   ├── shared/        # Reusable components
│   └── pages/         # Page components
├── public/            # Static assets
└── dist/              # Production build
```

## License

Private - [CHK] NO FACE CLAN
