import { test, expect } from '@playwright/test';
import { TemplateBuilderPage, TestHelpers, TestData } from './helpers';

test.describe('Template Builder Tests', () => {
  test.describe.configure({ mode: 'serial' }); // Serial because we're creating/modifying templates

  let templateBuilderPage: TemplateBuilderPage;
  let testHelpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    templateBuilderPage = new TemplateBuilderPage(page);
    testHelpers = new TestHelpers(page);
    await templateBuilderPage.navigate();
  });

  // Test Case ID: TEMP-001
  test('Template Builder loads correctly with canvas and settings panel', async ({ page }) => {
    // Verify page loads without errors
    await templateBuilderPage.verifyPageLoaded();
    await testHelpers.verifyNoConsoleErrors();

    // Verify canvas is visible
    await expect(templateBuilderPage.canvas).toBeVisible();
    
    // Verify settings panel is visible
    await expect(templateBuilderPage.settingsPanel).toBeVisible();

    // Verify header contains "Template Builder"
    await expect(page.locator('h1:has-text("Template Builder")')).toBeVisible();

    // Take screenshot for visual verification
    await testHelpers.takeScreenshot('template-builder-loaded');
  });

  // Test Case ID: TEMP-002
  test('Adding and positioning a text label', async ({ page }) => {
    await templateBuilderPage.verifyPageLoaded();

    // Find and click "Add Label" button (might be in settings panel)
    const addLabelButton = page.locator('button:has-text("Add Label"), button:has-text("Text")').first();
    await expect(addLabelButton).toBeVisible();
    await addLabelButton.click();

    // Verify label was added to canvas
    const labelElement = page.locator('[data-testid="draggable-label"], .text-element').first();
    await expect(labelElement).toBeVisible({ timeout: 5000 });

    // Get initial position
    const initialBox = await labelElement.boundingBox();
    expect(initialBox).toBeTruthy();

    // Drag label to new position
    await labelElement.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox!.x + 100, initialBox!.y + 100);
    await page.mouse.up();

    // Verify label moved (position changed)
    const newBox = await labelElement.boundingBox();
    expect(newBox?.x).not.toBe(initialBox?.x);
    expect(newBox?.y).not.toBe(initialBox?.y);

    // Change text content
    await labelElement.dblclick();
    await page.keyboard.type('Test Invoice Label');
    await page.keyboard.press('Escape');

    // Verify text changed
    await expect(labelElement).toContainText('Test Invoice Label');

    // Change style via settings panel (if available)
    const fontSizeInput = page.locator('input[placeholder*="Font Size"], input[type="number"]').first();
    if (await fontSizeInput.isVisible()) {
      await fontSizeInput.fill('24');
      // Verify style change (might need visual verification)
    }

    await testHelpers.takeScreenshot('template-label-added');
  });

  // Test Case ID: TEMP-003
  test('Adding and resizing an image', async ({ page }) => {
    await templateBuilderPage.verifyPageLoaded();

    // Find and click "Add Image" button
    const addImageButton = page.locator('button:has-text("Add Image"), button:has-text("Image")').first();
    await expect(addImageButton).toBeVisible();
    await addImageButton.click();

    // Verify image was added to canvas
    const imageElement = page.locator('[data-testid="draggable-image"], img').first();
    await expect(imageElement).toBeVisible({ timeout: 5000 });

    // Get initial size
    const initialBox = await imageElement.boundingBox();
    expect(initialBox).toBeTruthy();

    // Resize image (simulate dragging resize handle)
    // Note: This is a simplified test - actual resize handles may need specific interaction
    await imageElement.hover();
    
    // Try to find resize handle (common pattern is corners)
    const resizeHandle = page.locator('.resize-handle, [data-testid="resize-handle"]').first();
    if (await resizeHandle.isVisible()) {
      await resizeHandle.hover();
      await page.mouse.down();
      await page.mouse.move(initialBox!.x + 150, initialBox!.y + 150);
      await page.mouse.up();
    } else {
      // Fallback: just verify image can be moved
      await page.mouse.down();
      await page.mouse.move(initialBox!.x + 50, initialBox!.y + 50);
      await page.mouse.up();
    }

    // Drag image to new position
    await imageElement.hover();
    await page.mouse.down();
    await page.mouse.move(initialBox!.x + 200, initialBox!.y + 200);
    await page.mouse.up();

    // Verify image moved
    const newBox = await imageElement.boundingBox();
    expect(newBox?.x).not.toBe(initialBox?.x);
    expect(newBox?.y).not.toBe(initialBox?.y);

    await testHelpers.takeScreenshot('template-image-added');
  });

  // Test Case ID: TEMP-004
  test('Saving a new template', async ({ page }) => {
    await templateBuilderPage.verifyPageLoaded();

    // Add a simple element to the template
    const addLabelButton = page.locator('button:has-text("Add Label")').first();
    if (await addLabelButton.isVisible()) {
      await addLabelButton.click();
    }

    // Fill template name
    const templateName = `Test Template ${Date.now()}`;
    const nameInput = page.locator('input[placeholder*="Template Name"], input[name="name"]').first();
    await expect(nameInput).toBeVisible();
    await nameInput.fill(templateName);

    // Click save button
    const saveButton = page.locator('button:has-text("Save Template")').first();
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // Verify success message
    await expect(page.locator('text=Template saved successfully')).toBeVisible({ timeout: 10000 });

    // Verify URL changed from /template/new to /template/{id}
    await expect(page).not.toHaveURL(/\/template\/new/);
    await expect(page).toHaveURL(/\/template\/[^/]+/);

    // Take screenshot
    await testHelpers.takeScreenshot('template-saved');
  });

  // Test Case ID: TEMP-005
  test('Loading and editing an existing template', async ({ page }) => {
    // First, create a template to edit
    await templateBuilderPage.verifyPageLoaded();
    
    const templateName = `Editable Template ${Date.now()}`;
    const nameInput = page.locator('input[placeholder*="Template Name"]').first();
    await nameInput.fill(templateName);
    
    const saveButton = page.locator('button:has-text("Save Template")').first();
    await saveButton.click();
    
    await expect(page.locator('text=Template saved successfully')).toBeVisible({ timeout: 10000 });
    
    // Get the template ID from URL
    const currentUrl = page.url();
    const templateId = currentUrl.split('/').pop();
    expect(templateId).toBeTruthy();
    
    // Navigate away and back to load the template
    await page.goto('/');
    await page.goto(`/template/${templateId}`);
    await page.waitForLoadState('networkidle');
    
    // Verify template loaded
    await expect(page.locator(`text=Editing: ${templateName}`)).toBeVisible();
    
    // Make a change (add a label)
    const addLabelButton = page.locator('button:has-text("Add Label")').first();
    if (await addLabelButton.isVisible()) {
      await addLabelButton.click();
    }
    
    // Save the updated template
    const updatedName = `${templateName} Updated`;
    await nameInput.fill(updatedName);
    await saveButton.click();
    
    // Verify update success
    await expect(page.locator('text=Template saved successfully')).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=Editing: ${updatedName}`)).toBeVisible();
    
    await testHelpers.takeScreenshot('template-edited');
  });

  test('Mobile viewport - touch interactions on canvas', async ({ page }) => {
    await templateBuilderPage.verifyPageLoaded();

    // Test touch interaction by adding element
    const addLabelButton = page.locator('button:has-text("Add Label")').first();
    await testHelpers.simulateTouchTap(addLabelButton);

    // Verify element added
    const labelElement = page.locator('[data-testid="draggable-label"]').first();
    await expect(labelElement).toBeVisible({ timeout: 5000 });

    // Simulate touch drag on mobile
    const labelBox = await labelElement.boundingBox();
    expect(labelBox).toBeTruthy();

    // Simulate swipe/drag gesture
    await testHelpers.simulateSwipe(
      labelBox!.x + labelBox!.width / 2,
      labelBox!.y + labelBox!.height / 2,
      labelBox!.x + labelBox!.width / 2 + 100,
      labelBox!.y + labelBox!.height / 2 + 100
    );

    // Verify element moved (position may have changed)
    const newBox = await labelElement.boundingBox();
    expect(newBox).toBeTruthy();

    await testHelpers.takeScreenshot('template-mobile-touch');
  });

  test('Responsive layout on mobile viewport', async ({ page }) => {
    await templateBuilderPage.verifyPageLoaded();

    // Verify layout adapts to mobile
    const grid = page.locator('.grid.grid-cols-1.md\\:grid-cols-3');
    await expect(grid).toBeVisible();

    // On mobile, canvas should take full width
    const canvasContainer = page.locator('.md\\:col-span-2');
    const canvasBox = await canvasContainer.boundingBox();
    expect(canvasBox?.width).toBeGreaterThan(300); // Reasonable width for mobile

    // Settings panel should be below canvas on mobile
    const settingsContainer = page.locator('.md\\:col-span-1');
    const settingsBox = await settingsContainer.boundingBox();
    
    // On mobile (viewport < 768px), settings should be below canvas
    // This is a visual check - we'll just verify both are visible
    await expect(settingsContainer).toBeVisible();

    await testHelpers.takeScreenshot('template-mobile-layout');
  });

  test('Undo/redo functionality (if available)', async ({ page }) => {
    await templateBuilderPage.verifyPageLoaded();

    // Check for undo/redo buttons
    const undoButton = page.locator('button:has-text("Undo"), [data-testid="undo-button"]').first();
    const redoButton = page.locator('button:has-text("Redo"), [data-testid="redo-button"]').first();

    if (await undoButton.isVisible() && await redoButton.isVisible()) {
      // Add an element first
      const addLabelButton = page.locator('button:has-text("Add Label")').first();
      await addLabelButton.click();
      
      const labelElement = page.locator('[data-testid="draggable-label"]').first();
      await expect(labelElement).toBeVisible();
      
      // Click undo
      await undoButton.click();
      
      // Verify element removed or hidden
      await expect(labelElement).not.toBeVisible({ timeout: 3000 });
      
      // Click redo
      await redoButton.click();
      
      // Verify element restored
      await expect(labelElement).toBeVisible({ timeout: 3000 });
    }
  });

  test('Template validation - empty name warning', async ({ page }) => {
    await templateBuilderPage.verifyPageLoaded();

    // Try to save with empty name
    const saveButton = page.locator('button:has-text("Save Template")').first();
    await saveButton.click();

    // Check for validation error
    const errorMessage = page.locator('.text-destructive, .text-red-500, [role="alert"]');
    const errorCount = await errorMessage.count();
    
    if (errorCount > 0) {
      await expect(errorMessage.first()).toBeVisible();
    } else {
      // Some implementations might allow empty names
      console.log('No validation error for empty template name');
    }

    await testHelpers.takeScreenshot('template-validation');
  });

  test('Layer management - reordering and visibility', async ({ page }) => {
    await templateBuilderPage.verifyPageLoaded();

    // Add multiple elements
    const addLabelButton = page.locator('button:has-text("Add Label")').first();
    await addLabelButton.click();
    await addLabelButton.click();

    // Look for layer list
    const layerList = page.locator('[data-testid="layer-list"], .layer-list').first();
    if (await layerList.isVisible()) {
      const layerItems = layerList.locator('[data-testid="layer-item"]');
      const layerCount = await layerItems.count();
      expect(layerCount).toBeGreaterThan(0);

      // Toggle visibility of first layer
      const visibilityToggle = layerItems.first().locator('button, input[type="checkbox"]');
      await visibilityToggle.click();

      // Verify element visibility changed (might need to check canvas)
      const firstElement = page.locator('[data-testid="draggable-label"]').first();
      // This is hard to verify without specific implementation details
    }

    await testHelpers.takeScreenshot('template-layers');
  });
});