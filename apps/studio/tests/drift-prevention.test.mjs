import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_PROJECT_DATA,
  DEFAULT_JOURNAL_DATA,
  DEFAULT_TEAM_DATA,
  DEFAULT_FINANCE_DATA,
} from '../dist/schemas/index.js';

import {
  BASELINE_PROJECT,
  BASELINE_PROJECT_PROGRESS,
  BASELINE_PLANNED_SESSIONS,
  SAFETY_PRACTICES,
  BASELINE_TEAM_MEMBERS,
  BASELINE_TEAM_AREAS,
  BASELINE_PRODUCT_FAQS,
  BASELINE_TRANSPARENCY_FAQS,
  BASELINE_FINANCE_OVERVIEW,
  FINANCE_OVERVIEW,
} from '../../../src/data/campaign.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../../..');

test('Kiểm thử chống lệch (Drift Prevention): Studio defaults khớp chính xác BASELINE C18 V3', () => {
  // 1. Project: sessions, activities, stages, safetyPractices, progress
  assert.deepEqual(
    DEFAULT_PROJECT_DATA.plannedSessions,
    BASELINE_PLANNED_SESSIONS,
    'DEFAULT_PROJECT_DATA.plannedSessions phải khớp BASELINE_PLANNED_SESSIONS (V3)'
  );

  assert.deepEqual(
    DEFAULT_PROJECT_DATA.activities,
    BASELINE_PROJECT.activities,
    'DEFAULT_PROJECT_DATA.activities phải khớp BASELINE_PROJECT.activities (V3)'
  );

  assert.deepEqual(
    DEFAULT_PROJECT_DATA.plannedStages,
    BASELINE_PROJECT.plannedStages,
    'DEFAULT_PROJECT_DATA.plannedStages phải khớp BASELINE_PROJECT.plannedStages (V3)'
  );

  assert.deepEqual(
    DEFAULT_PROJECT_DATA.safetyPractices,
    SAFETY_PRACTICES,
    'DEFAULT_PROJECT_DATA.safetyPractices phải khớp SAFETY_PRACTICES (V3)'
  );

  assert.deepEqual(
    DEFAULT_PROJECT_DATA.progress,
    BASELINE_PROJECT_PROGRESS,
    'DEFAULT_PROJECT_DATA.progress phải khớp BASELINE_PROJECT_PROGRESS (tuần 2, updatedAt 2026-10-12)'
  );

  // 2. Team: members, areas, productFaqs, transparencyFaqs
  assert.deepEqual(
    DEFAULT_TEAM_DATA.members,
    BASELINE_TEAM_MEMBERS,
    'DEFAULT_TEAM_DATA.members phải khớp BASELINE_TEAM_MEMBERS (7 thành viên V3)'
  );

  assert.deepEqual(
    DEFAULT_TEAM_DATA.areas,
    BASELINE_TEAM_AREAS,
    'DEFAULT_TEAM_DATA.areas phải khớp BASELINE_TEAM_AREAS (5 mảng việc V3)'
  );

  assert.deepEqual(
    DEFAULT_TEAM_DATA.productFaqs,
    BASELINE_PRODUCT_FAQS,
    'DEFAULT_TEAM_DATA.productFaqs phải khớp BASELINE_PRODUCT_FAQS (4 câu hỏi V3)'
  );

  assert.deepEqual(
    DEFAULT_TEAM_DATA.transparencyFaqs,
    BASELINE_TRANSPARENCY_FAQS,
    'DEFAULT_TEAM_DATA.transparencyFaqs phải khớp BASELINE_TRANSPARENCY_FAQS (5 câu hỏi V3)'
  );

  // 3. Journal: 2 bài viết công khai
  const journalJsonPath = path.join(rootDir, 'src/data/journal-entries.json');
  const journalExpected = JSON.parse(fs.readFileSync(journalJsonPath, 'utf-8'));
  assert.deepEqual(
    DEFAULT_JOURNAL_DATA,
    journalExpected,
    'DEFAULT_JOURNAL_DATA phải khớp từng ký tự với src/data/journal-entries.json (V3)'
  );

  // 4. Finance: overview.disclaimer
  assert.equal(
    DEFAULT_FINANCE_DATA.overview.disclaimer,
    BASELINE_FINANCE_OVERVIEW.disclaimer,
    'DEFAULT_FINANCE_DATA.overview.disclaimer phải khớp BASELINE_FINANCE_OVERVIEW.disclaimer'
  );

  assert.equal(
    DEFAULT_FINANCE_DATA.overview.disclaimer,
    FINANCE_OVERVIEW.disclaimer,
    'DEFAULT_FINANCE_DATA.overview.disclaimer phải khớp proxy FINANCE_OVERVIEW.disclaimer'
  );
});
