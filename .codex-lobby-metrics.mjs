import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import {
  createAdminClient,
  buildDisposableUsers,
  createDisposableUsers,
  deleteDisposableUsers,
  signIn,
  baseUrl,
  cleanupBattleRoom,
} from './scripts/battle-test-helpers.mjs';

const admin = createAdminClient();
const spec = buildDisposableUsers(1, 'codex-lobby-metrics');
const users = await createDisposableUsers(admin, spec);
const browser = await chromium.launch({ headless: true });
let roomId = null;
try {
  const context = await browser.newContext({ viewport: { width: 1728, height: 1117 } });
  const page = await context.newPage();
  await signIn(page, users[0]);
  await page.goto(`${baseUrl}/app/battle`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.getByRole('button', { name: 'Create Private Room' }).click();
  await page.waitForURL(/\/app\/battle\/lobby\//, { timeout: 60000 });
  await page.waitForTimeout(2500);
  roomId = page.url().split('/').pop() ?? null;
  assert.ok(roomId, 'missing roomId');

  const heading = page.getByRole('heading', { level: 1 });
  const timerText = page.getByText(/\d\d:\d\d/).first();
  const rosterTitle = page.getByText('Players In Room', { exact: true });
  const stateTitle = page.getByText('Your Lobby State', { exact: true });
  const rulesTitle = page.getByText('Match Start Rules', { exact: true });
  const readyButton = page.getByRole('button', { name: 'Ready Up' });
  const leaveButton = page.getByRole('button', { name: 'Leave Lobby' });

  const metrics = {
    viewport: page.viewportSize(),
    heading: await heading.boundingBox(),
    timerText: await timerText.boundingBox(),
    rosterTitle: await rosterTitle.boundingBox(),
    stateTitle: await stateTitle.boundingBox(),
    rulesTitle: await rulesTitle.boundingBox(),
    readyButton: await readyButton.boundingBox(),
    leaveButton: await leaveButton.boundingBox(),
    bodyText: await page.locator('body').innerText(),
  };

  console.log(JSON.stringify(metrics, null, 2));
} finally {
  await browser.close();
  if (roomId) await cleanupBattleRoom(admin, roomId);
  await deleteDisposableUsers(admin, users);
}
