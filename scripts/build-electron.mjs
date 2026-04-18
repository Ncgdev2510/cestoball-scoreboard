import * as esbuild from 'esbuild';
import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const distElectron = path.join(root, 'dist-electron');
const pemSrc = path.join(root, 'electron', 'publicKey.pem');
const watch = process.argv.includes('--watch');

mkdirSync(distElectron, { recursive: true });

function copyPem() {
  if (!existsSync(pemSrc)) {
    console.warn(
      'Aviso: falta electron/publicKey.pem. Ejecutá npm run license:gen-keys.'
    );
  } else {
    copyFileSync(pemSrc, path.join(distElectron, 'publicKey.pem'));
  }
}

const mainOutFile = path.join(distElectron, 'main.cjs');

const buildOptions = {
  entryPoints: [
    path.join(root, 'electron', 'main.ts'),
    path.join(root, 'electron', 'preload.ts'),
  ],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outdir: distElectron,
  outExtension: { '.js': '.cjs' },
  external: ['electron'],
  sourcemap: true,
  define: {
    'import.meta.url': JSON.stringify(pathToFileURL(mainOutFile).href),
  },
  plugins: [
    {
      name: 'copy-public-pem',
      setup(build) {
        build.onEnd((result) => {
          if (!result.errors.length) copyPem();
        });
      },
    },
  ],
};

if (watch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('Electron: watch activo (electron/*.ts)');
} else {
  await esbuild.build(buildOptions);
  console.log('Electron compilado en dist-electron/');
}
