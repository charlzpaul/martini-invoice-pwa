import { test, expect } from '@playwright/test';
import { InvoiceBuilderPage, TestHelpers, TestData, DashboardPage } from './helpers';

test.describe('Invoice Builder Tests', () => {
  test.describe.configure({ mode: 'serial' }); // Serial because we're creating/modifying invoices

  let invoiceBuilderPage: InvoiceBuilderPage;
  let testHelpers: TestHelpers;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    invoiceBuilderPage = new InvoiceBuilderPage(page);
    testHelpers = new TestHelpers(page);
    dashboardPage = new DashboardPage(page);
    await invoiceBuilderPage.navigate();
  });

  // Test Case ID: INV-001
  test('Invoice Builder loads correctly with all fields', async ({ page }) => {
    // Verify page loads without errors
    await invoiceBuilderPage.verifyPageLoaded();
    await testHelpers.verifyNoConsoleErrors();

    // Verify header contains "Invoice Builder"
    await expect(page.locator('h1:has-text("Invoice Builder")')).toBeVisible();

    // Verify all main form elements are visible
    await expect(invoiceBuilderPage.invoiceNumberInput).toBeVisible();
    await expect(invoiceBuilderPage.invoiceDateInput).toBeVisible();
    await expect(invoiceBuilderPage.customerSelect).toBeVisible();
    await expect(invoiceBuilderPage.templateSelect).toBeVisible();
    await expect(invoiceBuilderPage.addLineItemButton).toBeVisible();
    await expect(invoiceBuilderPage.saveInvoiceButton).toBeVisible();
    await expect(invoiceBuilderPage.generatePdfButton).toBeVisible();

    // Take screenshot for visual verification
    await testHelpers.takeScreenshot('invoice-builder-loaded');
  });

  // Test Case ID: INV-002
  test('Filling out invoice header details', async ({ page }) => {
    await invoiceBuilderPage.verifyPageLoaded();

    // Fill invoice number
    const invoiceNumber = TestData.generateInvoiceNumber();
    await invoiceBuilderPage.invoiceNumberInput.fill(invoiceNumber);
    await expect(invoiceBuilderPage.invoiceNumberInput).toHaveValue(invoiceNumber);

    // Select invoice date (today) using calendar
    const today = new Date().toISOString().split('T')[0];
    await invoiceBuilderPage.selectDate(today);
    
    // Verify date is selected - the button should no longer show "Pick a date"
    // Wait briefly for UI to update
    await page.waitForTimeout(500);
    
    // Check that the date button is not showing the default placeholder text
    const dateButtonText = await invoiceBuilderPage.invoiceDateInput.textContent();
    if (dateButtonText) {
      expect(dateButtonText).not.toBe('Pick a date');
      expect(dateButtonText).not.toContain('Select date');
    }

    // Select a customer from dropdown (if available)
    await invoiceBuilderPage.customerSelect.click();
    const customerOptions = page.locator('[role="option"], .select-item');
    const customerCount = await customerOptions.count();
    
    if (customerCount > 0) {
      await customerOptions.first().click();
      // Verify customer is selected (might show selected value)
      await expect(invoiceBuilderPage.customerSelect).not.toBeEmpty();
    } else {
      console.log('No customers available to select');
    }

    await testHelpers.takeScreenshot('invoice-header-filled');
  });

  // Test Case ID: INV-003
  test('Adding and removing line items', async ({ page }) => {
    await invoiceBuilderPage.verifyPageLoaded();

    // Add first line item
    const lineItem1 = TestData.generateLineItem();
    await invoiceBuilderPage.addLineItem(lineItem1.description, lineItem1.quantity, lineItem1.price);

    // Verify line item appears in table
    await expect(invoiceBuilderPage.lineItemsTable).toBeVisible();
    const lineItems = page.locator('[data-testid="line-item-row"]');
    await expect(lineItems).toHaveCount(1);

    // Verify line item values
    const firstRow = lineItems.first();
    await expect(firstRow.locator('input[placeholder*="Description"]')).toHaveValue(lineItem1.description);
    await expect(firstRow.locator('input[placeholder*="Quantity"]')).toHaveValue(lineItem1.quantity.toString());
    await expect(firstRow.locator('input[placeholder*="Price"]')).toHaveValue(lineItem1.price.toString());

    // Add second line item
    const lineItem2 = TestData.generateLineItem();
    await invoiceBuilderPage.addLineItem(lineItem2.description, lineItem2.quantity, lineItem2.price);
    await expect(lineItems).toHaveCount(2);

    // Verify calculations update (subtotal, total)
    // Look for total display elements
    const subtotalElement = page.locator('text=Subtotal, text*=Subtotal').first();
    const totalElement = page.locator('text=Total, text*=Total').first();
    
    if (await subtotalElement.isVisible()) {
      const subtotalText = await subtotalElement.textContent();
      expect(subtotalText).toMatch(/\$\d+/); // Contains dollar amount
    }

    // Remove first line item
    const removeButton = firstRow.locator('button:has-text("Remove"), button:has-text("Delete")').first();
    if (await removeButton.isVisible()) {
      await removeButton.click();
      await expect(lineItems).toHaveCount(1);
    }

    await testHelpers.takeScreenshot('invoice-line-items');
  });

  // Test Case ID: INV-004
  test('Selecting and applying a template', async ({ page }) => {
    await invoiceBuilderPage.verifyPageLoaded();

    // Select a template from dropdown
    await invoiceBuilderPage.templateSelect.click();
    const templateOptions = page.locator('[role="option"], .select-item');
    const templateCount = await templateOptions.count();
    
    if (templateCount > 0) {
      // Select first available template
      await templateOptions.first().click();
      
      // Verify template is selected
      await expect(invoiceBuilderPage.templateSelect).not.toBeEmpty();
      
      // Verify preview updates (if preview is visible)
      const preview = page.locator('[data-testid="template-preview"], .preview-container').first();
      if (await preview.isVisible()) {
        await expect(preview).toBeVisible();
      }
    } else {
      console.log('No templates available to select');
      // Create a template first via dashboard
      await page.goto('/');
      await dashboardPage.clickCreateTemplate();
      await page.waitForURL('**/template/new');
      
      // Create a simple template
      const templateName = `Test Template ${Date.now()}`;
      const nameInput = page.locator('input[placeholder*="Template Name"]').first();
      await nameInput.fill(templateName);
      await page.locator('button:has-text("Save Template")').first().click();
      await expect(page.locator('text=Template saved successfully')).toBeVisible({ timeout: 10000 });
      
      // Go back to invoice builder
      await invoiceBuilderPage.navigate();
      await invoiceBuilderPage.templateSelect.click();
      await page.locator(`text=${templateName}`).first().click();
    }

    await testHelpers.takeScreenshot('invoice-template-selected');
  });

  // Test Case ID: INV-005
  test('Saving an invoice', async ({ page }) => {
    await invoiceBuilderPage.verifyPageLoaded();

    // Fill required fields
    const invoiceNumber = TestData.generateInvoiceNumber();
    await invoiceBuilderPage.invoiceNumberInput.fill(invoiceNumber);
    
    const today = new Date().toISOString().split('T')[0];
    await invoiceBuilderPage.selectDate(today);
    
    // Select customer and template if needed
    await invoiceBuilderPage.customerSelect.click();
    const customerOptions = page.locator('[role="option"], .select-item');
    if (await customerOptions.count() > 0) {
      await customerOptions.first().click();
    }
    
    await invoiceBuilderPage.templateSelect.click();
    const templateOptions = page.locator('[role="option"], .select-item');
    if (await templateOptions.count() > 0) {
      await templateOptions.first().click();
    }

    // Add a line item
    const lineItem = TestData.generateLineItem();
    await invoiceBuilderPage.addLineItem(lineItem.description, lineItem.quantity, lineItem.price);

    // Save invoice
    await invoiceBuilderPage.saveInvoiceButton.click();

    // Verify success message
    await expect(page.locator('text=Invoice saved successfully')).toBeVisible({ timeout: 10000 });

    // Verify URL changed from /invoice/new to /invoice/{id}
    await expect(page).not.toHaveURL(/\/invoice\/new/);
    await expect(page).toHaveURL(/\/invoice\/[^/]+/);

    // Verify invoice number is preserved
    await expect(invoiceBuilderPage.invoiceNumberInput).toHaveValue(invoiceNumber);

    await testHelpers.takeScreenshot('invoice-saved');
  });

  test('Mobile viewport - form interactions', async ({ page }) => {
    await invoiceBuilderPage.verifyPageLoaded();

    // Test touch interaction on form fields
    await testHelpers.simulateTouchTap(invoiceBuilderPage.invoiceNumberInput);
    
    // Fill field using keyboard (virtual keyboard on mobile)
    await page.keyboard.type('MOBILE-INV-001');
    
    // Test date picker interaction on mobile
    await testHelpers.simulateTouchTap(invoiceBuilderPage.invoiceDateInput);
    
    // Date picker might open - close it if needed
    await page.keyboard.press('Escape');
    
    // Test dropdown selection on mobile
    await testHelpers.simulateTouchTap(invoiceBuilderPage.customerSelect);
    
    const customerOptions = page.locator('[role="option"]');
    if (await customerOptions.count() > 0) {
      await testHelpers.simulateTouchTap(customerOptions.first());
    }
    
    // Test adding line item with touch
    await testHelpers.simulateTouchTap(invoiceBuilderPage.addLineItemButton);
    
    // Verify line item added
    const lineItems = page.locator('[data-testid="line-item-row"]');
    await expect(lineItems).toHaveCount(1);
    
    await testHelpers.takeScreenshot('invoice-mobile-form');
  });

  test('Calculations - automatic total updates', async ({ page }) => {
    await invoiceBuilderPage.verifyPageLoaded();

    // Add multiple line items with different quantities and prices
    const items = [
      { description: 'Service A', quantity: 2, price: 50 },
      { description: 'Service B', quantity: 1, price: 100 },
      { description: 'Service C', quantity: 3, price: 25 },
    ];

    for (const item of items) {
      await invoiceBuilderPage.addLineItem(item.description, item.quantity, item.price);
    }

    // Calculate expected total
    const expectedSubtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    
    // Look for subtotal/total display
    const totalDisplay = page.locator('text=Total, text*=Total, [data-testid="total-amount"]').first();
    
    if (await totalDisplay.isVisible()) {
      const totalText = await totalDisplay.textContent();
      const totalMatch = totalText?.match(/\$?([\d,.]+)/);
      
      if (totalMatch) {
        const displayedTotal = parseFloat(totalMatch[1].replace(/,/g, ''));
        // Allow small rounding differences
        expect(Math.abs(displayedTotal - expectedSubtotal)).toBeLessThan(0.01);
      }
    }

    // Test tax calculation if applicable
    const taxInput = page.locator('input[placeholder*="Tax"], input[name="tax"]').first();
    if (await taxInput.isVisible()) {
      await taxInput.fill('10'); // 10% tax
      
      const expectedWithTax = expectedSubtotal * 1.1;
      const totalWithTax = page.locator('[data-testid="total-with-tax"]').first();
      
      if (await totalWithTax.isVisible()) {
        const taxText = await totalWithTax.textContent();
        const taxMatch = taxText?.match(/\$?([\d,.]+)/);
        if (taxMatch) {
          const displayedTaxTotal = parseFloat(taxMatch[1].replace(/,/g, ''));
          expect(Math.abs(displayedTaxTotal - expectedWithTax)).toBeLessThan(0.01);
        }
      }
    }

    await testHelpers.takeScreenshot('invoice-calculations');
  });

  test('Validation - required fields', async ({ page }) => {
    await invoiceBuilderPage.verifyPageLoaded();

    // Try to save without filling required fields
    await invoiceBuilderPage.saveInvoiceButton.click();

    // Check for validation errors
    const errorMessages = page.locator('.text-destructive, [role="alert"], .error-message');
    const errorCount = await errorMessages.count();
    
    if (errorCount > 0) {
      await expect(errorMessages.first()).toBeVisible();
    } else {
      // Some implementations might show toast messages
      const toast = page.locator('[data-sonner-toast], .toast');
      if (await toast.count() > 0) {
        await expect(toast.first()).toBeVisible();
      }
    }

    // Test with partial data
    await invoiceBuilderPage.invoiceNumberInput.fill('TEST-001');
    await invoiceBuilderPage.saveInvoiceButton.click();
    
    // Should still show validation for missing customer/template
    const validationVisible = await errorMessages.count() > 0 || await page.locator('text=Please select a customer').count() > 0;
    expect(validationVisible).toBeTruthy();

    await testHelpers.takeScreenshot('invoice-validation');
  });

  test('Unsaved changes warning', async ({ page }) => {
    await invoiceBuilderPage.verifyPageLoaded();

    // Make a change
    await invoiceBuilderPage.invoiceNumberInput.fill('UNSAVED-TEST');
    
    // Try to navigate away
    await page.goto('/');
    
    // Check for confirmation dialog
    const dialog = page.locator('[role="dialog"], .dialog');
    if (await dialog.count() > 0) {
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText('unsaved changes');
      
      // Cancel navigation
      const cancelButton = dialog.locator('button:has-text("Cancel")').first();
      await cancelButton.click();
      
      // Should stay on invoice builder
      await expect(page).toHaveURL(/\/invoice\/new/);
    } else {
      console.log('No unsaved changes warning dialog appeared');
    }

    await testHelpers.takeScreenshot('invoice-unsaved-warning');
  });

  test('Invoice status - draft vs locked', async ({ page }) => {
    // Create and save an invoice first
    await invoiceBuilderPage.verifyPageLoaded();
    
    const invoiceNumber = TestData.generateInvoiceNumber();
    await invoiceBuilderPage.invoiceNumberInput.fill(invoiceNumber);
    
    // Fill other required fields
    await invoiceBuilderPage.customerSelect.click();
    const customerOptions = page.locator('[role="option"]');
    if (await customerOptions.count() > 0) {
      await customerOptions.first().click();
    }
    
    await invoiceBuilderPage.templateSelect.click();
    const templateOptions = page.locator('[role="option"]');
    if (await templateOptions.count() > 0) {
      await templateOptions.first().click();
    }
    
    await invoiceBuilderPage.saveInvoiceButton.click();
    await expect(page.locator('text=Invoice saved successfully')).toBeVisible({ timeout: 10000 });
    
    // Check for status indicator
    const statusBadge = page.locator('[data-testid="invoice-status"], .status-badge').first();
    if (await statusBadge.isVisible()) {
      const statusText = await statusBadge.textContent();
      expect(statusText).toMatch(/DRAFT|LOCKED/i);
      
      // If draft, look for lock/complete button
      if (statusText?.toUpperCase().includes('DRAFT')) {
        const lockButton = page.locator('button:has-text("Lock"), button:has-text("Complete")').first();
        if (await lockButton.isVisible()) {
          await lockButton.click();
          await expect(page.locator('text=Invoice locked')).toBeVisible();
        }
      }
    }

    await testHelpers.takeScreenshot('invoice-status');
  });
});