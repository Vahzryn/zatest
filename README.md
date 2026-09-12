# Zapixal

Fast, privacy-first image conversion and compression directly in your browser.

Zapixal processes images locally using WebAssembly, Web Workers, and browser APIs. Your images are not uploaded to a server for conversion.

## Features

- Local, client-side image & document processing
- Batch conversion and compression
- HEIC, JPG, PNG, WebP, AVIF, SVG, BMP, and ICO support
- PDF merge, split, compression, and image extraction
- Developer utilities: JSON formatter, CSV/JSON converter, JWT decoder, Regex tester
- Text tools: Markdown live previewer, side-by-side Diff viewer
- Web Workers and WebAssembly for responsive local execution
- Adaptive concurrency and memory protection for high-volume batches
- Zero account required
- Zero server uploads for core file processing

## Technology

- React
- TypeScript
- Vite
- Tailwind CSS
- Web Workers
- WebAssembly
- Cloudflare Pages
- Cloudflare Functions

## Development

Install dependencies:

```bash
npm install
```


Start the development server:
```
npm run dev
```

Build for production:
```
npm run build
```

The production output is generated in dist/.

##Testing

Run the test suite:
```
npm test
```

Run TypeScript checks:
```
npm run lint
```

##Embeds

Zapixal provides optional public integrations for websites and blogs.

### Web Component

```html
<script src="https://zapixal.com/zapixal-web-component.js" defer></script>
<zapixal-blog-tool></zapixal-blog-tool>
```

### Widget

```html
<div id="zapixal-widget"></div>
<script src="https://zapixal.com/widget.js" defer></script>
```

These integrations are provided free of charge and process supported images locally in the user's browser.

##Privacy

Zapixal's core image processing is client-side. Image files are processed in the user's browser rather than uploaded to a conversion server.

Feedback is handled separately through a Cloudflare Function.

##Deployment

Zapixal is designed for static deployment on platforms such as Cloudflare Pages.

The production build generates the static application and required SEO assets.

## License

Copyright © 2026 Zapixal. All rights reserved.

Zapixal is proprietary software. All rights are reserved.

Third-party dependencies are distributed under their respective licenses.
