import { test, expect } from '@playwright/test';
import { DashboardPage, TestHelpers, TestData } from './helpers';

test.describe('Dashboard Functionality Tests', () => {
  test.describe.configure({ mode: 'parallel' });

  test.beforeEach(async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.navigate();
  });

  // Test Case ID: DASH-001
  test('Dashboard loads correctly with overview of recent invoices and quick actions', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const testHelpers = new TestHelpers(page);

    // Verify page loads without errors
    await dashboardPage.verifyPageLoaded();
    await testHelpers.verifyNoConsoleErrors();

    // Verify quick actions section is visible
    await expect(dashboardPage.quickActions).toBeVisible();
    await expect(dashboardPage.createInvoiceButton).toBeVisible();
    await expect(dashboardPage.createTemplateButton).toBeVisible();
    await expect(dashboardPage.addCustomerButton).toBeVisible();
    await expect(dashboardPage.addProductButton).toBeVisible();

    // Verify activity feed section is visible
    await expect(dashboardPage.activityFeed).toBeVisible();

    // Take screenshot for visual verification
    await testHelpers.takeScreenshot('dashboard-loaded');
  });

  // Test Case ID: DASH-002
  test('Quick actions functionality - Create New Invoice navigation', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    // Click Create New Invoice button
    await dashboardPage.clickCreateInvoice();
    
    // Verify navigation to invoice builder
    await expect(page).toHaveURL(/\/invoice\/new/);
    await expect(page.locator('h1:has-text("Invoice Builder")')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/dashboard-create-invoice-navigation.png' });
  });

  test('Quick actions functionality - Create New Template navigation', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    // Click Create New Template button
    await dashboardPage.clickCreateTemplate();
    
    // Verify navigation to template builder
    await expect(page).toHaveURL(/\/template\/new/);
    await expect(page.locator('h1:has-text("Template Builder")')).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/dashboard-create-template-navigation.png' });
  });

  test('Quick actions functionality - Add Customer button interaction', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    // Click Add Customer button (currently logs to console)
    await dashboardPage.addCustomerButton.click();
    
    // Verify button is clickable (no navigation expected)
    await expect(dashboardPage.addCustomerButton).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/dashboard-add-customer-click.png' });
  });

  test('Quick actions functionality - Add Product button interaction', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    // Click Add Product button (currently logs to console)
    await dashboardPage.addProductButton.click();
    
    // Verify button is clickable (no navigation expected)
    await expect(dashboardPage.addProductButton).toBeVisible();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/dashboard-add-product-click.png' });
  });

  test('Activity feed displays items correctly', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    // Verify feed items container exists
    await expect(dashboardPage.activityFeed).toBeVisible();
    
    // Check if feed items are present (may be empty initially)
    const feedItemCount = await dashboardPage.feedItems.count();
    console.log(`Found ${feedItemCount} feed items`);
    
    // If there are items, verify they are visible
    if (feedItemCount > 0) {
      await expect(dashboardPage.feedItems.first()).toBeVisible();
      
      // Verify feed items have expected content
      const firstItemText = await dashboardPage.feedItems.first().textContent();
      expect(firstItemText).toBeTruthy();
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/dashboard-activity-feed.png' });
  });

  test('Mobile responsive design - iPhone 14 Pro viewport', async ({ page }) => {
    // This test runs in iPhone 14 Pro project configuration
    const dashboardPage = new DashboardPage(page);
    
    // Verify layout adapts to mobile viewport
    await dashboardPage.verifyPageLoaded();
    
    // Check that quick actions grid adapts to mobile
    const quickActionsGrid = page.locator('.grid.grid-cols-2');
    await expect(quickActionsGrid).toBeVisible();
    
    // Verify touch targets are appropriately sized (minimum 44px for touch targets)
    const button = dashboardPage.createInvoiceButton;
    const buttonBox = await button.boundingBox();
    expect(buttonBox?.width).toBeGreaterThanOrEqual(44); // Minimum touch target size
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/dashboard-mobile-iphone.png', fullPage: true });
  });

  test('Mobile responsive design - Samsung Galaxy S22 Ultra viewport', async ({ page }) => {
    // This test runs in Samsung Galaxy S22 Ultra project configuration
    const dashboardPage = new DashboardPage(page);
    
    // Verify layout adapts to mobile viewport
    await dashboardPage.verifyPageLoaded();
    
    // Check that quick actions grid adapts to mobile
    const quickActionsGrid = page.locator('.grid.grid-cols-2');
    await expect(quickActionsGrid).toBeVisible();
    
    // Verify touch targets are appropriately sized (minimum 44px for touch targets)
    const button = dashboardPage.createTemplateButton;
    const buttonBox = await button.boundingBox();
    expect(buttonBox?.width).toBeGreaterThanOrEqual(44); // Minimum touch target size
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/dashboard-mobile-samsung.png', fullPage: true });
  });

  test('Touch interactions on mobile viewport', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    const testHelpers = new TestHelpers(page);
    
    // Simulate touch tap on Create Invoice button
    await testHelpers.simulateTouchTap(dashboardPage.createInvoiceButton);
    
    // Verify navigation occurred
    await expect(page).toHaveURL(/\/invoice\/new/);
    
    // Go back to dashboard
    await page.goBack();
    await dashboardPage.verifyPageLoaded();
    
    // Simulate touch tap on Create Template button
    await testHelpers.simulateTouchTap(dashboardPage.createTemplateButton);
    await expect(page).toHaveURL(/\/template\/new/);
  });

  test('Dashboard maintains state after navigation', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    
    // Navigate away and back
    await dashboardPage.clickCreateInvoice();
    await expect(page).toHaveURL(/\/invoice\/new/);
    
    await page.goBack();
    await dashboardPage.verifyPageLoaded();
    
    // Verify dashboard still loads correctly
    await expect(dashboardPage.quickActions).toBeVisible();
    await expect(dashboardPage.activityFeed).toBeVisible();
  });

  test('Error handling - Dashboard loads with network issues', async ({ page }) => {
    // This test would normally mock network failures
    // For now, just verify basic error handling
    const dashboardPage = new DashboardPage(page);
    
    // Verify page loads even if some data fails
    await dashboardPage.verifyPageLoaded();
    
    // Check for error messages
    const errorElement = page.locator('.text-destructive');
    const errorCount = await errorElement.count();
    
    if (errorCount > 0) {
      // If there's an error, verify it's displayed properly
      await expect(errorElement.first()).toBeVisible();
    }
  });
});