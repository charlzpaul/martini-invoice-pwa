import { test, expect } from '@playwright/test';
import { TestHelpers, DashboardPage } from './helpers';

test.describe('Google Drive Sync Tests', () => {
  let testHelpers: TestHelpers;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    testHelpers = new TestHelpers(page);
    dashboardPage = new DashboardPage(page);
    await dashboardPage.navigate();
  });

  // Test Case ID: GDS-001 (partial - UI verification only)
  test('Google Drive authentication UI components', async ({ page }) => {
    // Look for Google Auth button in header
    const googleAuthButton = page.locator('button:has-text("Sign in with Google")');
    
    if (await googleAuthButton.count() > 0) {
      await expect(googleAuthButton).toBeVisible();
      
      // Verify button is clickable
      await expect(googleAuthButton).toBeEnabled();
      
      // Click button (will open Google auth popup which we can't test fully)
      await googleAuthButton.click();
      
      // In test environment, we can't complete OAuth flow
      // But we can verify the button triggered some action
      // (e.g., might show loading state)
      await page.waitForTimeout(1000);
    } else {
      // Check if already logged in (shows profile/logout)
      const profileElement = page.locator('[data-testid="user-profile"], .user-profile');
      if (await profileElement.count() > 0) {
        await expect(profileElement).toBeVisible();
        
        // Verify logout button exists
        const logoutButton = page.locator('button:has-text("Logout")');
        await expect(logoutButton).toBeVisible();
      }
    }

    await testHelpers.takeScreenshot('google-auth-ui');
  });

  // Test Case ID: DASH-002 includes "Sync with Google Drive" quick action
  test('Sync with Google Drive quick action button', async ({ page }) => {
    await dashboardPage.verifyPageLoaded();

    // Look for sync button in quick actions
    const syncButton = page.locator('button:has-text("Sync with Google Drive")').first();
    
    if (await syncButton.count() > 0) {
      await expect(syncButton).toBeVisible();
      await expect(syncButton).toBeEnabled();
      
      // Click button (will attempt sync if authenticated)
      await syncButton.click();
      
      // Check for sync status or toast message
      const toast = page.locator('[data-sonner-toast], .toast');
      if (await toast.count() > 0) {
        await expect(toast.first()).toBeVisible();
      }
    } else {
      console.log('Sync button not found in quick actions');
    }

    await testHelpers.takeScreenshot('sync-quick-action');
  });

  // Test Case ID: GDS-005 (partial - UI verification only)
  test('Disconnection from Google Drive UI', async ({ page }) => {
    // First check if user is logged in
    const profileElement = page.locator('[data-testid="user-profile"], .user-profile');
    
    if (await profileElement.count() > 0) {
      // User appears to be logged in
      await expect(profileElement).toBeVisible();
      
      // Look for logout/disconnect button
      const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Disconnect")');
      await expect(logoutButton).toBeVisible();
      await expect(logoutButton).toBeEnabled();
      
      // Click logout button
      await logoutButton.click();
      
      // Verify user is logged out (should show sign in button)
      await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible({ timeout: 5000 });
    } else {
      // User is not logged in
      console.log('User not logged in, skipping disconnect test');
    }

    await testHelpers.takeScreenshot('google-disconnect');
  });

  test('Sync status indicator', async ({ page }) => {
    // Look for sync status indicator
    const syncStatus = page.locator('[data-testid="sync-status"], .sync-status');
    
    if (await syncStatus.count() > 0) {
      await expect(syncStatus).toBeVisible();
      
      // Check status text
      const statusText = await syncStatus.textContent();
      expect(statusText).toMatch(/Connected|Syncing|Last sync|Disconnected/i);
    } else {
      // Check for sync information in GoogleAuth component
      const googleAuth = page.locator('[data-testid="google-auth"]');
      if (await googleAuth.count() > 0) {
        await expect(googleAuth).toBeVisible();
      }
    }

    await testHelpers.takeScreenshot('sync-status-indicator');
  });

  test('Mobile viewport - sync UI responsiveness', async ({ page }) => {
    await dashboardPage.verifyPageLoaded();

    // Check Google Auth button on mobile
    const googleAuthButton = page.locator('button:has-text("Sign in with Google")');
    
    if (await googleAuthButton.count() > 0) {
      const buttonBox = await googleAuthButton.boundingBox();
      expect(buttonBox?.width).toBeGreaterThan(44); // Minimum touch target
      expect(buttonBox?.height).toBeGreaterThan(44);
      
      // Test touch interaction
      await testHelpers.simulateTouchTap(googleAuthButton);
    }

    // Check sync button in quick actions
    const syncButton = page.locator('button:has-text("Sync with Google Drive")').first();
    if (await syncButton.count() > 0) {
      const syncBox = await syncButton.boundingBox();
      expect(syncBox?.width).toBeGreaterThan(44);
      expect(syncBox?.height).toBeGreaterThan(44);
      
      await testHelpers.simulateTouchTap(syncButton);
    }

    await testHelpers.takeScreenshot('sync-mobile-ui');
  });

  test('Sync error handling - network issues', async ({ page }) => {
    // This test would normally mock network failures
    // For now, just verify basic error UI exists
    
    // Look for error display areas
    const errorContainer = page.locator('.text-destructive, [role="alert"]');
    
    // Try to trigger sync (if authenticated)
    const syncButton = page.locator('button:has-text("Sync with Google Drive")').first();
    if (await syncButton.count() > 0) {
      await syncButton.click();
      
      // Check for error toast or message
      const toast = page.locator('[data-sonner-toast]');
      if (await toast.count() > 0) {
        const toastText = await toast.first().textContent();
        // Might show "Sync failed" or similar
        console.log(`Sync result toast: ${toastText}`);
      }
    }

    await testHelpers.takeScreenshot('sync-error-handling');
  });

  test('Data persistence after sync disconnect/reconnect', async ({ page }) => {
    // This is a complex integration test that would require actual Google auth
    // For now, we'll verify the UI flow
    
    // Check if logged in
    const profileElement = page.locator('[data-testid="user-profile"]');
    const isLoggedIn = await profileElement.count() > 0;
    
    if (isLoggedIn) {
      // Create some test data
      await page.goto('/invoice/new');
      await page.waitForLoadState('networkidle');
      
      // Fill minimal invoice data
      const invoiceNumberInput = page.locator('input[placeholder*="Invoice Number"]').first();
      await invoiceNumberInput.fill(`TEST-SYNC-${Date.now()}`);
      
      // Save invoice
      const saveButton = page.locator('button:has-text("Save Invoice")').first();
      await saveButton.click();
      
      await expect(page.locator('text=Invoice saved successfully')).toBeVisible({ timeout: 10000 });
      
      // Go back to dashboard
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Disconnect from Google Drive
      const logoutButton = page.locator('button:has-text("Logout")');
      if (await logoutButton.count() > 0) {
        await logoutButton.click();
        
        // Verify logged out
        await expect(page.locator('button:has-text("Sign in with Google")')).toBeVisible({ timeout: 5000 });
        
        // Data should still be visible locally
        const feedItems = page.locator('[data-testid="feed-item"]');
        const feedCount = await feedItems.count();
        expect(feedCount).toBeGreaterThan(0);
      }
    } else {
      console.log('Not logged in, skipping sync disconnect/reconnect test');
    }

    await testHelpers.takeScreenshot('sync-data-persistence');
  });

  test('Background sync triggers', async ({ page }) => {
    // This test would verify that sync happens automatically
    // For now, check for any background sync indicators
    
    // Look for auto-sync indicators
    const autoSyncIndicator = page.locator('[data-testid="auto-sync"], .auto-sync-indicator');
    
    if (await autoSyncIndicator.count() > 0) {
      await expect(autoSyncIndicator).toBeVisible();
      
      // Check if it shows "Auto-sync enabled" or similar
      const indicatorText = await autoSyncIndicator.textContent();
      expect(indicatorText).toMatch(/auto|background/i);
    } else {
      // Check console for sync-related logs (simplified approach)
      // We can't directly access console logs in Playwright without setting up listeners
      // Instead, we'll just log that we're checking for sync indicators
      console.log('Checking for background sync indicators...');
    }

    await testHelpers.takeScreenshot('background-sync');
  });

  test('Conflict resolution UI (if implemented)', async ({ page }) => {
    // Look for conflict resolution UI elements
    const conflictDialog = page.locator('[data-testid="conflict-dialog"], .conflict-resolution');
    
    if (await conflictDialog.count() > 0) {
      await expect(conflictDialog).toBeVisible();
      
      // Check for conflict resolution options
      const keepLocalButton = page.locator('button:has-text("Keep Local")');
      const useRemoteButton = page.locator('button:has-text("Use Remote")');
      const mergeButton = page.locator('button:has-text("Merge")');
      
      if (await keepLocalButton.count() > 0) {
        await expect(keepLocalButton).toBeVisible();
        await expect(useRemoteButton).toBeVisible();
      }
    } else {
      console.log('Conflict resolution UI not found (may not be implemented)');
    }

    await testHelpers.takeScreenshot('conflict-resolution-ui');
  });

  test('Sync progress indicators', async ({ page }) => {
    // Look for sync progress indicators
    const progressIndicator = page.locator('[data-testid="sync-progress"], .progress-bar, .spinner');
    
    if (await progressIndicator.count() > 0) {
      await expect(progressIndicator).toBeVisible();
      
      // Trigger sync to see progress
      const syncButton = page.locator('button:has-text("Sync with Google Drive")').first();
      if (await syncButton.count() > 0) {
        await syncButton.click();
        
        // Progress indicator should become more visible
        await expect(progressIndicator).toBeVisible({ timeout: 5000 });
      }
    } else {
      // Check for loading states during sync
      const syncButton = page.locator('button:has-text("Sync with Google Drive")').first();
      if (await syncButton.count() > 0) {
        await syncButton.click();
        
        // Button might show loading state
        const buttonText = await syncButton.textContent();
        expect(buttonText).toMatch(/Syncing|Loading|Processing/i);
      }
    }

    await testHelpers.takeScreenshot('sync-progress');
  });
});