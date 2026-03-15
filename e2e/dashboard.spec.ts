// [E2E Test] 핵심 유저 시나리오: 메인 대시보드 접속 및 업로드 UI 확인
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';

test.describe('대시보드 — 핵심 유저 시나리오', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 쿠키 세팅 (미인증 상태면 /login으로 리다이렉트됨)
    await page.context().addCookies([
      {
        name: 'autoqa_auth',
        value: '1',
        domain: new URL(BASE_URL).hostname,
        path: '/',
      },
    ]);
  });

  test('대시보드 페이지가 정상 로드된다', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // 페이지 타이틀 또는 헤더 확인
    await expect(page).toHaveTitle(/Auto.?QA|대시보드/i);
  });

  test('데이터 업로드 영역이 렌더링된다', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // 업로드 섹션 존재 확인
    const uploadSection = page.getByText(/파일.*업로드|업로드.*파일|데이터 업로드/i).first();
    await expect(uploadSection).toBeVisible();
  });

  test('전월 CSV 업로드 버튼이 표시된다', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // 전월 파일 업로드 영역 확인
    const baselineLabel = page.getByText(/전월|기준월|이전달/i).first();
    await expect(baselineLabel).toBeVisible();
  });

  test('당월 CSV 업로드 버튼이 표시된다', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    // 당월 파일 업로드 영역 확인
    const targetLabel = page.getByText(/당월|검수월|이번달/i).first();
    await expect(targetLabel).toBeVisible();
  });

  test('파일 입력 요소(input[type=file])가 2개 존재한다', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    const fileInputs = page.locator('input[type="file"]');
    await expect(fileInputs).toHaveCount(2);
  });

  test('CSV 및 Excel 파일 형식만 허용한다', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);

    const fileInput = page.locator('input[type="file"]').first();
    const accept = await fileInput.getAttribute('accept');

    // CSV 또는 Excel MIME 타입이 accept 속성에 포함되어야 함
    expect(accept).toMatch(/csv|xlsx|xls|spreadsheet/i);
  });

  test('미인증 상태에서 /dashboard 접근 시 /login으로 리다이렉트된다', async ({ browser }) => {
    // 쿠키 없는 새 컨텍스트
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${BASE_URL}/dashboard`);

    // /login 또는 로그인 페이지로 이동 확인
    await expect(page).toHaveURL(/\/login/);
    await context.close();
  });

  test('/api/health 엔드포인트가 200 OK를 반환한다', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/health`);

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeTruthy();
  });
});
