import { defineConfig } from 'tsup';

export default defineConfig([
  // Core SDK (framework-agnostic)
  {
    entry: { index: 'src/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    splitting: true,
    treeshake: true,
    minify: true,
    sourcemap: true,
    external: ['react', 'vue', 'socket.io-client'],
    outExtension({ format }) {
      return { js: format === 'esm' ? '.js' : '.cjs' };
    },
  },
  // React integration
  {
    entry: { react: 'src/react/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    splitting: true,
    treeshake: true,
    minify: true,
    sourcemap: true,
    external: ['react', '@devlock/sdk'],
    outExtension({ format }) {
      return { js: format === 'esm' ? '.js' : '.cjs' };
    },
  },
  // Next.js integration
  {
    entry: { next: 'src/next/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    splitting: true,
    treeshake: true,
    minify: true,
    sourcemap: true,
    external: ['react', 'next', '@devlock/sdk'],
    outExtension({ format }) {
      return { js: format === 'esm' ? '.js' : '.cjs' };
    },
  },
  // Vue integration
  {
    entry: { vue: 'src/vue/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    splitting: true,
    treeshake: true,
    minify: true,
    sourcemap: true,
    external: ['vue', '@devlock/sdk'],
    outExtension({ format }) {
      return { js: format === 'esm' ? '.js' : '.cjs' };
    },
  },
]);
