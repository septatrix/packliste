// @ts-check
import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
  // GitHub Pages serves project sites from a `/<repo>/` subpath.
  site: 'https://septatrix.github.io',
  base: '/packliste',
  integrations: [
    vue({
      // Enable Vue's experimental Vapor mode compilation. Because Astro
      // islands hydrate as independent app roots, each interactive component
      // can be its own Vapor app with no cross-island vdom interop.
      // Components opt in per-file via `<script setup vapor>`.
      // If a toolchain in a given environment rejects Vapor, remove the
      // `vapor` attribute from the SFCs to fall back to standard Vue.
      template: {
        compilerOptions: {},
      },
    }),
  ],
});
