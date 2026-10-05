import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const temp = mkdtempSync(join(tmpdir(), 'konitif-tools-package-'));
const run = (command, args, cwd = root) => execFileSync(command, args, {
  cwd, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
  env: { ...process.env, npm_config_offline: 'true', npm_config_cache: join(temp, 'cache') }
});
const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
assert.equal(manifest.name, '@konitif/tools');
assert.deepEqual(manifest.dependencies, { '@konitif/core': '0.284.2' });
// Windows npm is a .cmd shim, not an executable for execFileSync.
// Run the already-installed CLI through Node, without a shell or download.
const packArgs = ['pack', '--offline', '--ignore-scripts', '--json', '--pack-destination', temp];
let packOutput;
if (process.platform === 'win32') {
  const npmCli = join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  assert.ok(existsSync(npmCli), `Installed npm CLI required at ${npmCli}; no automatic installation`);
  packOutput = run(process.execPath, [npmCli, ...packArgs]);
} else {
  packOutput = run('npm', packArgs);
}
const [packed] = JSON.parse(packOutput);
const files = packed.files.map(file => file.path);
for (const file of files) assert.match(file, /^(dist\/|src\/|reference\/|package\.json$|README\.md$|LICENSE\.md$)/);
for (const file of ['dist/index.js', 'dist/index.d.ts', 'dist/surface.js', 'dist/surface.d.ts', 'dist/input.js', 'dist/input.d.ts', 'src/index.ts', 'src/input.ts', 'src/surface.ts', 'LICENSE.md', 'reference/catalog.json', 'reference/diagrams.json']) assert.ok(files.includes(file), file);
const consumer = join(temp, 'consumer');
const dependency = join(consumer, 'node_modules/@konitif/tools');
mkdirSync(dependency, { recursive: true });
run('tar', ['-xzf', join(temp, packed.filename), '-C', dependency, '--strip-components=1']);
// Reuse installed, locked Core: never fetch or substitute workspace source.
const core = realpathSync(join(root, 'node_modules/@konitif/core'));
const coreManifest = JSON.parse(readFileSync(join(core, 'package.json'), 'utf8'));
assert.equal(coreManifest.name, '@konitif/core');
assert.equal(coreManifest.version, '0.284.2');
assert.deepEqual(coreManifest.dependencies ?? {}, {});
cpSync(core, join(consumer, 'node_modules/@konitif/core'), { recursive: true });
for (const file of files.filter(file => file.endsWith('.map'))) {
  const mapPath = join(dependency, file);
  const map = JSON.parse(readFileSync(mapPath, 'utf8'));
  for (const source of map.sources) {
    const sourcePath = resolve(dirname(mapPath), map.sourceRoot ?? '', source);
    const rel = relative(dependency, sourcePath);
    assert.ok(!rel.startsWith('..') && !isAbsolute(rel) && existsSync(sourcePath), file);
  }
}
cpSync(join(root, 'tests/consumer.mts'), join(consumer, 'consumer.mts'));
run(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '--noEmit', '--strict', '--target', 'ES2022', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', 'consumer.mts'], consumer);
run(process.execPath, ['--input-type=module', '-e', `
  import assert from 'node:assert/strict';
  import {defineKonitifToolModule, bindKonitifToolModule, KonitifToolModuleRegistry, mountKonitifToolSurface} from '@konitif/tools';
  let calls = 0;
  const module = defineKonitifToolModule({id:'external',name:'External',capability:'inspect',definition:{ready:true}});
  const binding = bindKonitifToolModule({module,loadComponent:async()=>{calls++;return 'component';}});
  const registry = new KonitifToolModuleRegistry(); registry.register(module);
  assert.equal(calls,0); assert.equal(registry.get(module.id),module);
  assert.throws(()=>registry.register(module),/Duplicate/);
  assert.equal(await binding.loadComponent(),'component'); assert.equal(calls,1);
  let cleanups = 0;
  const surface = {requiredServices:['projection'],mount:()=>({dispose(){cleanups++;}})};
  const refused = await mountKonitifToolSurface(surface,{target:1,state:{},services:{}});
  assert.equal(refused.status,'refused');
  const mounted = await mountKonitifToolSurface(surface,{target:1,state:{},services:{projection:{}}});
  assert.equal(mounted.status,'mounted');
  await Promise.all([mounted.instance.dispose(),mounted.instance.dispose()]);
  assert.equal(cleanups,1);
  const {resolveInteractionInputActions}=await import('@konitif/tools/input');
  const signal={source:'keyboard',controlId:'Space',phase:'press'};
  assert.deepEqual(resolveInteractionInputActions([{id:'play',actionId:'play',source:'keyboard',controlId:'Space',phase:'press'}],signal),[{actionId:'play',bindingId:'play',signal}]);
`], consumer);
console.log(JSON.stringify({ consumer: 'passed (ESM and TypeScript)', integrity: packed.integrity, bytes: packed.size, files: files.length, evidence: temp }));
