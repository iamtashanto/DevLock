import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    express: 'src/adapters/express.ts',
    fastify: 'src/adapters/fastify.ts',
    nestjs: 'src/adapters/nestjs.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: true,
  treeshake: true,
  minify: true,
  sourcemap: true,
  external: ['express', 'fastify', '@nestjs/common', '@nestjs/core', 'ioredis', 'bullmq'],
  outExtension({ format }) {
    return { js: format === 'esm' ? '.js' : '.cjs' };
  },
});
