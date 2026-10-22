import test from 'node:test';
import assert from 'node:assert/strict';
import { matchService, summarize } from '../rating.mjs';
const services = [
  { id: 1, urls: ['example.com'], rating: 'A' },
  { id: 2, urls: ['pay.example.com'], rating: 'D' },
  { id: 3, urls: ['example.com/product'], rating: 'E' }
];
test('accepts parent domains and prefers the most specific service', () => {
  assert.equal(matchService('www.example.com', services).id, 1);
  assert.equal(matchService('pay.example.com', services).id, 2);
  assert.equal(matchService('example.com', services).id, 1);
});
test('rejects lookalikes and path-only reviews', () => {
  assert.equal(matchService('notexample.com', services), null);
  assert.equal(matchService('example.com.attacker.net', services), null);
  assert.equal(matchService('example.com', [services[2]]), null);
});
test('maps all grades and keeps unknown results distinct from zero', () => {
  for (const [rating, score] of Object.entries({ A: 10, B: 7.5, C: 5, D: 2.5, E: 0 })) {
    assert.equal(summarize({ rating }).score, score);
  }
  assert.equal(summarize(null).state, 'unknown');
  assert.equal(summarize({ rating: 'N/A' }).state, 'unrated');
  assert.equal(summarize({ rating: 'N/A' }).score, null);
});
