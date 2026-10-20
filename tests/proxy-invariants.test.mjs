import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCTS,
  PLANNED_SESSIONS,
  TEAM_MEMBERS,
  CAMPAIGN_PROJECT,
  OFFICIAL_CONTACT,
  DONATION_ACCOUNT,
  DONATION_LEDGER,
  FINANCE_OVERVIEW,
  PRODUCT_FAQS,
  SUPPORT_FAQS,
  TRANSPARENCY_FAQS,
} from '../src/data/campaign.ts';

test('Proxy invariants: array length descriptor must be non-configurable', () => {
  const arrays = [
    { name: 'PRODUCTS', arr: PRODUCTS, expectedLen: 7 },
    { name: 'PLANNED_SESSIONS', arr: PLANNED_SESSIONS, expectedLen: 2 },
    { name: 'TEAM_MEMBERS', arr: TEAM_MEMBERS, expectedLen: 7 },
    { name: 'PRODUCT_FAQS', arr: PRODUCT_FAQS, expectedLen: 4 },
    { name: 'SUPPORT_FAQS', arr: SUPPORT_FAQS, expectedLen: 5 },
    { name: 'TRANSPARENCY_FAQS', arr: TRANSPARENCY_FAQS, expectedLen: 5 },
  ];

  for (const { name, arr, expectedLen } of arrays) {
    const desc = Object.getOwnPropertyDescriptor(arr, 'length');
    assert.ok(desc, `${name} should have length descriptor`);
    assert.equal(desc.value, expectedLen, `${name} length value should match`);
    assert.equal(desc.configurable, false, `${name} length descriptor MUST be non-configurable`);
    assert.equal(desc.enumerable, false, `${name} length descriptor MUST be non-enumerable`);
    assert.equal(desc.writable, true, `${name} length descriptor MUST be writable`);
  }
});

test('Proxy reflection: array functions, iteration and serialization', () => {
  // 1. Array spread
  const prods = [...PRODUCTS];
  assert.equal(prods.length, 7);
  assert.equal(prods[0].id, 'chuon-chuon-tre-kem-de');

  // 2. Map and filter
  const titles = PLANNED_SESSIONS.map((s) => s.title);
  assert.deepEqual(titles, ['Buổi chơi tại Mái ấm', 'Gặp lại và trao quà']);

  const roles = TEAM_MEMBERS.map((m) => m.role);
  assert.ok(roles.includes('Trưởng dự án'));
  assert.ok(roles.includes('Tài chính, thủ quỹ'));

  // 3. Object.keys & Object.entries
  const keys = Object.keys(PRODUCTS);
  assert.equal(keys.length, 7);
  assert.deepEqual(keys, ['0', '1', '2', '3', '4', '5', '6']);

  const entries = Object.entries(PLANNED_SESSIONS);
  assert.equal(entries.length, 2);
  assert.equal(entries[0][1].id, 'buoi-choi');

  // 4. JSON.stringify
  const jsonStr = JSON.stringify(TEAM_MEMBERS);
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.length, 7);
  assert.equal(parsed[0].name, 'Nguyễn Chí Trung');
});

test('Proxy invariants: objects reflection and properties', () => {
  const objects = [
    { name: 'CAMPAIGN_PROJECT', obj: CAMPAIGN_PROJECT },
    { name: 'OFFICIAL_CONTACT', obj: OFFICIAL_CONTACT },
    { name: 'DONATION_ACCOUNT', obj: DONATION_ACCOUNT },
    { name: 'DONATION_LEDGER', obj: DONATION_LEDGER },
    { name: 'FINANCE_OVERVIEW', obj: FINANCE_OVERVIEW },
  ];

  for (const { name, obj } of objects) {
    const keys = Object.keys(obj);
    assert.ok(keys.length > 0, `${name} should have own keys`);
    for (const key of keys) {
      const desc = Object.getOwnPropertyDescriptor(obj, key);
      assert.ok(desc, `${name}.${key} should have descriptor`);
      assert.equal(typeof desc.value !== 'undefined', true);
    }
  }
});
