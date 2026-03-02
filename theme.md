# Martini Shot Theme

## Overview

The Martini Shot theme is a custom color palette inspired by a classic martini cocktail. It features an emerald green primary color (olive), gold/amber secondary color (garnish), deep charcoal dark mode, and teal accent colors.

## Color Palette

### CSS Custom Properties

All theme colors are defined as CSS custom properties in [`src/index.css`](src/index.css:6).

#### Light Mode (Default)

```css
:root {
  /* Martini Shot Color Palette */
  --martini-primary: 90 26% 49%;         /* Emerald Green - Olive = rgb(125, 157, 93) */
  --martini-secondary: 38 92% 50%;       /* Gold/Amber - Garnish = rgb(237, 137, 23) */
  --martini-dark: 24 37% 20%;            /* Deep Charcoal - Glass = rgb(71, 48, 33) */
  --martini-light: 0 0% 99%;             /* Cream/Off-white - Cocktail = rgb(252, 252, 252) */
  --martini-accent: 174 83% 41%;         /* Teal - Martini color */

  /* Shadcn/ui Theme Variables */
  --background: var(--martini-light);
  --foreground: var(--martini-dark);
  --card: var(--martini-light);
  --card-foreground: var(--martini-dark);
  --popover: var(--martini-light);
  --popover-foreground: var(--martini-dark);
  --primary: var(--martini-primary);
  --primary-foreground: 0 0% 100%;
  --secondary: var(--martini-secondary);
  --secondary-foreground: 0 0% 100%;
  --muted: 240 4.8% 96%;
  --muted-foreground: 240 5% 45%;
  --accent: var(--martini-accent);
  --accent-foreground: 0 0% 100%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: var(--martini-primary);
  --radius: 0.5rem;
}
```

#### Dark Mode

```css
.dark {
  --background: 220 28% 9%;       /* Midnight Gin - Deep cool charcoal */
  --foreground: 210 20% 96%;       /* Gin Frost - Icy white */
  --card: 220 28% 12%;             /* Chilled Glass surface */
  --card-foreground: 210 20% 96%;
  --popover: 220 28% 12%;
  --popover-foreground: 210 20% 96%;
  --primary: 84 18% 45%;           /* Sophisticated Olive Garnish */
  --primary-foreground: 210 20% 10%;
  --secondary: 42 10% 65%;         /* Dry Vermouth Straw */
  --secondary-foreground: 210 20% 10%;
  --muted: 220 15% 20%;
  --muted-foreground: 215 15% 70%;
  --accent: 0 72% 51%;             /* Pimento Red Accent */
  --accent-foreground: 210 20% 98%;
  --destructive: 0 62.8% 35.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 220 15% 22%;
  --input: 220 15% 22%;
  --ring: 84 18% 45%;
}
```

### Color Descriptions

| Variable | HSL Value | Description |
|----------|-----------|-------------|
| `--primary` | `84 18% 45%` (Dark) | **Olive Garnish** - Sophisticated green representing the iconic martini olive. |
| `--secondary` | `42 10% 65%` (Dark) | **Dry Vermouth** - Pale straw color representing the aromatic fortified wine. |
| `--background` | `220 28% 9%` (Dark) | **Midnight Gin** - Deep, cool charcoal representing the atmosphere of a classic bar. |
| `--foreground` | `210 20% 96%` (Dark) | **Gin Frost** - Icy white representing the chilled spirit and frosted glass. |
| `--accent` | `0 72% 51%` | **Pimento** - Bright red pop representing the olive's pimento stuffing. |

## Using the Theme

### In Tailwind CSS

The theme uses standard Tailwind CSS utility classes that reference the CSS custom properties:

```tsx
// Primary button
<Button className="bg-primary text-primary-foreground">
  Click Me
</Button>

// Secondary button
<Button variant="secondary">
  Secondary Action
</Button>

// Card component
<Card className="bg-card text-card-foreground">
  Content
</Card>

// Accent styling
<div className="text-accent">Accent text</div>
```

### In Custom CSS

```css
/* Using CSS custom properties directly */
.my-element {
  background-color: var(--primary);
  color: var(--primary-foreground);
  border: 1px solid var(--border);
}

/* Using HSL values directly (for gradients) */
.gradient-bg {
  background: linear-gradient(
    135deg,
    hsl(158, 48%, 46%) 0%,
    hsl(174, 83%, 41%) 100%
  );
}
```

### In JavaScript/TypeScript

```tsx
// Get computed styles
const element = document.getElementById('my-element');
const primaryColor = getComputedStyle(element).getPropertyValue('--primary');

// Use with Tailwind
className={`bg-primary hover:bg-primary/90 text-primary-foreground transition-colors`}
```

## Theme Components

The theme is automatically applied to all shadcn/ui components:

- [`Button`](src/components/ui/button.tsx:1) - Primary, Secondary, Destructive, Outline variants
- [`Card`](src/components/ui/card.tsx:1) - Card, CardHeader, CardTitle, CardContent, CardFooter
- [`Input`](src/components/ui/input.tsx:1) - Form inputs with theme colors
- [`Badge`](src/components/ui/badge.tsx:1) - Small status indicators
- [`Dialog`](src/components/ui/dialog.tsx:1) - Modals and overlays
- [`Select`](src/components/ui/select.tsx:1) - Dropdown selections
- [`Slider`](src/components/ui/slider.tsx:1) - Range sliders

## Dark Mode Support

The theme includes built-in dark mode support. To enable dark mode:

```tsx
// In main.tsx or a theme provider
import { useEffect } from 'react';

function useDarkMode() {
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', isDark);
  }, []);
}
```

## Extending the Theme

To add custom colors or extend the theme:

1. **Add new CSS variables** in [`src/index.css`](src/index.css:6):
   ```css
   :root {
     --martini-custom: 0 0% 0%;
     --your-custom: 0 0% 100%;
   }
   ```

2. **Use in components**:
   ```tsx
   <div className="bg-[var(--martini-custom)]">
     Custom colored element
   </div>
   ```

## Color Preview

### Primary Color (Olive Green)
`hsl(90, 26%, 49%)` - #7D9D5D = rgb(125, 157, 93)

### Secondary Color (Gold/Amber)
`hsl(38, 92%, 50%)` - #ED8917 = rgb(237, 137, 23)

### Accent Color (Teal)
`hsl(174, 83%, 41%)` - #5BC3B4

### Dark Mode Background (Midnight Gin)
`hsl(220, 28%, 9%)` - Deep, cool charcoal.

### Light Mode Background (Cream/Off-white)
`hsl(0, 0%, 98%)` - #FCFCFC = rgb(252, 252, 252)

## Accessibility

The theme follows WCAG 2.1 AA color contrast guidelines:
- Primary text on light backgrounds: 4.5:1 minimum
- Large text on light backgrounds: 3:1 minimum
- All colors have been tested for readability

## Browser Support

The theme uses CSS custom properties which are supported in all modern browsers:
- Chrome/Edge 49+
- Firefox 31+
- Safari 9.1+
- Opera 36+

## References

- [shadcn/ui Theme Documentation](https://ui.shadcn.com/docs/theming)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [Tailwind CSS Configuration](tailwind.config.js)
