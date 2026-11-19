// Vice Cover Studio's entrypoint (Node 22, standard library only). The
// app is plain static files under app/, so handing it in is just copying:
// app/ and screenshots/ go to /output, and /output/dossier.json is the
// summary the judge reads, written with the vendored make.fun library.
//
// Try it first with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The gate's caps (from the kit's RULES.txt): at most 4 screenshots, each
// at most 256 KiB; app/ at most 993 files and 48 MiB in all, no path over
// 1000 bytes; and /output as a whole under the platform's 1000-entry,
// 64 MiB cap, which app/, screenshots/ and dossier.json share. The
// dossier itself is capped at 1.5 MiB by the library's text limit.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
