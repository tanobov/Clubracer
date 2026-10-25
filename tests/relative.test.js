import test from 'node:test';
import assert from 'node:assert/strict';
import {relativeRows,flag,gapLabel} from '../src/relative.js';

test('nearest cars by track gap, rather than race position',()=>{
  const drivers=[{id:'me',position:5},{id:'far',gapSeconds:-20},{id:'behind',position:1,gapSeconds:2},{id:'near',position:20,gapSeconds:-1},{id:'ahead',gapSeconds:-3},{id:'invalid',gapSeconds:null}];
  assert.deepEqual(relativeRows(drivers,'me',2).map(d=>d.id),['ahead','near','me','behind']);
});
test('missing player does not show misleading relative data',()=>assert.deepEqual(relativeRows([], 'me'),[]));
test('country flags and missing nationality',()=>{assert.equal(flag('ar'),'🇦🇷');assert.equal(flag(null),'—');assert.equal(flag('ARG'),'—');});
test('signed gaps, reference and unavailable telemetry',()=>{assert.equal(gapLabel(-1.25,false),'−1.250');assert.equal(gapLabel(2,false),'+2.000');assert.equal(gapLabel(null,false),'—');assert.equal(gapLabel(42,true),'0.000');});
