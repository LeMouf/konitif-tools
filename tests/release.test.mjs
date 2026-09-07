import test from 'node:test';
import assert from 'node:assert/strict';
import { assertReleaseInputs, assertPublishingTools } from '../scripts/check-release.mjs';
const policy = { repository: 'LeMouf/konitif-tools', packageName: '@konitif/tools' };
const manifest = { name: policy.packageName, version: '0.284.1', private: false, license: 'PolyForm-Noncommercial-1.0.0', publishConfig: {access:'public'}, repository: {url:'git+https://github.com/LeMouf/konitif-tools.git'} };
const lock = { name: manifest.name, version: manifest.version, packages: {'':manifest} };
const env = { GITHUB_REPOSITORY: policy.repository, GITHUB_REF:'refs/tags/v0.284.1', GITHUB_EVENT_NAME:'push' };
test('release template admits exact source identity and matching tag',()=>assertReleaseInputs(policy,manifest,lock,env));
test('release template refuses foreign repo, branch, event and mismatched version',()=>{
  for(const change of [{GITHUB_REPOSITORY:'other/repo'},{GITHUB_REF:'refs/heads/main'},{GITHUB_REF:'refs/tags/v0.284.2'},{GITHUB_EVENT_NAME:'workflow_dispatch'}]) assert.throws(()=>assertReleaseInputs(policy,manifest,lock,{...env,...change}));
  assert.throws(()=>assertReleaseInputs(policy,{...manifest,private:true},lock,env));
  assert.throws(()=>assertReleaseInputs(policy,manifest,{...lock,version:'0.0.0'},env));
});
test('publishing tools fail closed without auto-upgrading',()=>{
  assertPublishingTools('24.20.0','11.19.0');
  for(const pair of [['20.0.0','11.19.0'],['24.20.0','10.9.4'],['24.20.0','11.5.1-beta']]) assert.throws(()=>assertPublishingTools(...pair));
});
