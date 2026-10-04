import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const base = import.meta.dirname;
const configuredApi = process.env.AURA_API ?? 'https://bezpieczna-aura.pl';
if (!['https://bezpieczna-aura.pl', 'https://bezpieczna-aura.pl/', 'http://localhost:3000', 'http://localhost:3000/'].includes(configuredApi)) {
  throw new Error('AURA_API must be the demo origin or http://localhost:3000');
}
const apiOrigin = new URL(configuredApi).origin;
const dist = path.resolve(base, 'dist');
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'icons'), { recursive: true });
fs.copyFileSync(path.join(base, 'manifest.json'), path.join(dist, 'manifest.json'));
fs.copyFileSync(path.resolve(base, '../../assets/scamerino_palette.css'), path.join(dist, 'palette.css'));
fs.copyFileSync(path.resolve(base, '../../assets/widget-avatar/avatar-128.png'), path.join(dist, 'avatar-128.png'));
fs.copyFileSync(path.join(base, 'src/options/login.css'), path.join(dist, 'login.css'));
fs.writeFileSync(path.join(dist, 'login.html'), `<!doctype html>
<html lang="pl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="palette.css">
  <link rel="stylesheet" href="login.css">
  <script src="login.js" defer></script>
</head>
<body><main id="login-root"></main></body>
</html>
`);
for (const size of [16, 32, 48, 128]) {
  fs.copyFileSync(path.resolve(base, `../../assets/widget-avatar/icon-${size}.png`), path.join(dist, `icons/icon-${size}.png`));
}
const queryPlugin = {
  name: 'aura-query',
  setup(build) {
    build.onResolve({ filter: /\?(raw|inline)$/ }, (args) => {
      const mode = args.path.match(/\?(raw|inline)$/)[1];
      const spec = args.path.replace(/\?(raw|inline)$/, '');
      return { path: path.resolve(args.resolveDir, spec), namespace: mode === 'raw' ? 'aura-raw' : 'aura-inline' };
    });
    build.onLoad({ filter: /.*/, namespace: 'aura-raw' }, (args) => ({
      contents: fs.readFileSync(args.path, 'utf8'), loader: 'text', watchFiles: [args.path],
    }));
    build.onLoad({ filter: /.*/, namespace: 'aura-inline' }, (args) => {
      if (path.extname(args.path) !== '.png') return { errors: [{ text: `Only PNG inline imports are supported: ${args.path}` }] };
      const url = 'data:image/png;base64,' + fs.readFileSync(args.path).toString('base64');
      return { contents: `export default ${JSON.stringify(url)};`, loader: 'js', watchFiles: [args.path] };
    });
  },
};
const options = {
  absWorkingDir: base,
  entryPoints: { content: 'src/content/main.js', sw: 'src/background/sw.js', login: 'src/options/login.js' },
  outdir: 'dist', bundle: true, format: 'iife', target: ['chrome120'],
  minify: false, sourcemap: false, legalComments: 'none', plugins: [queryPlugin],
  define: { __AURA_API__: JSON.stringify(apiOrigin) },
};
if (process.argv.includes('--watch')) {
  const context = await esbuild.context(options);
  await context.watch();
} else {
  await esbuild.build(options);
}
