#!/usr/bin/env node
/**
 * Requirement Test Generator
 * 
 * Generates E2E test specifications based on requirements.csv
 * Creates test templates for Playwright to verify each functional requirement
 * 
 * Usage: node generate-requirement-tests.cjs [--category CategoryName]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const categoryFilter = args.find(arg => arg.startsWith('--category='))?.split('=')[1];

// Parse requirements
function parseRequirements() {
  const csvPath = path.join(__dirname, '../../requirement.csv');
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim());
  
  const requirements = [];
  for (let i = 1; i < lines.length; i++) {
    const match = lines[i].match(/^([^,]+),([^,]+),"?([^"]+)"?/);
    if (match) {
      const [, id, category, requirement] = match;
      requirements.push({ 
        id: id.trim(), 
        category: category.trim().replace(/^"|"$/g, ''), 
        requirement: requirement.trim() 
      });
    }
  }
  
  return requirements;
}

// Generate test template for a requirement
function generateTestTemplate(req) {
  const testName = req.id.toLowerCase().replace(/-/g, '_');
  const description = req.requirement.slice(0, 100) + (req.requirement.length > 100 ? '...' : '');
  
  return `
/**
 * Test: ${req.id} - ${req.category}
 * Requirement: ${description}
 */
test('${req.id}: ${req.requirement.slice(0, 60)}...', async ({ page }) => {
  // TODO: Implement test for ${req.id}
  
  // 1. Setup: Login as appropriate user role
  // await loginAsCustomer(page)
  
  // 2. Navigate to relevant page
  // await page.goto('/stores')
  
  // 3. Perform actions to verify requirement
  // await page.click('[data-testid="store-card"]')
  
  // 4. Assert expected behavior
  // await expect(page.locator('[data-testid="store-name"]')).toBeVisible()
  
  test.skip('Implementation needed for ${req.id}');
});
`;
}

// Group requirements by category
function groupByCategory(requirements) {
  const grouped = {};
  requirements.forEach((req) => {
    if (!grouped[req.category]) {
      grouped[req.category] = [];
    }
    grouped[req.category].push(req);
  });
  return grouped;
}

// Generate test file for a category
function generateCategoryTestFile(category, requirements) {
  const safeName = category
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  
  const fileName = `${safeName}.spec.ts`;
  const filePath = path.join(__dirname, 'e2e', '10-requirements', fileName);
  
  let content = `import { test, expect } from '@playwright/test';\n`;
  content += `import { loginAsCustomer, loginAsVendor, loginAsAdmin } from '../fixtures/auth';\n\n`;
  content += `/**\n`;
  content += ` * Category: ${category}\n`;
  content += ` * Requirements: ${requirements.map(r => r.id).join(', ')}\n`;
  content += ` */\n`;
  content += `test.describe('${category}', () => {\n`;
  
  requirements.forEach((req) => {
    content += generateTestTemplate(req);
  });
  
  content += `});\n`;
  
  return { fileName, filePath, content };
}

// Main execution
function generate() {
  console.log('\n🧪 Generating Requirement Tests...\n');
  
  const requirements = parseRequirements();
  console.log(`📋 Loaded ${requirements.length} requirements\n`);
  
  const filtered = categoryFilter
    ? requirements.filter(r => r.category === categoryFilter)
    : requirements;
  
  const grouped = groupByCategory(filtered);
  
  // Create output directory
  const outputDir = path.join(__dirname, 'e2e', '10-requirements');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate test files
  let filesGenerated = 0;
  Object.entries(grouped).forEach(([category, reqs]) => {
    const testFile = generateCategoryTestFile(category, reqs);
    
    fs.writeFileSync(testFile.filePath, testFile.content, 'utf8');
    console.log(`✅ Generated: ${testFile.fileName} (${reqs.length} tests)`);
    filesGenerated++;
  });
  
  console.log(`\n✨ Generated ${filesGenerated} test files with ${filtered.length} test cases`);
  console.log(`📁 Location: e2e/10-requirements/\n`);
  
  // Generate index file
  const indexContent = `/**
 * Requirements Test Suite
 * Generated from requirements.csv
 * 
 * Run with: npx playwright test e2e/10-requirements
 */\nexport {};\n`;
  
  fs.writeFileSync(path.join(outputDir, 'README.md'), generateReadme(grouped), 'utf8');
  console.log(`📄 Generated: README.md\n`);
}

// Generate README for test suite
function generateReadme(grouped) {
  let readme = `# Requirements Test Suite\n\n`;
  readme += `Auto-generated from \`requirement.csv\`\n\n`;
  readme += `## Categories\n\n`;
  
  Object.entries(grouped).forEach(([category, reqs]) => {
    const safeName = category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    readme += `- **${category}** (${reqs.length} tests) - \`${safeName}.spec.ts\`\n`;
  });
  
  readme += `\n## Running Tests\n\n`;
  readme += `\`\`\`bash\n`;
  readme += `# Run all requirement tests\n`;
  readme += `npx playwright test e2e/10-requirements\n\n`;
  readme += `# Run specific category\n`;
  readme += `npx playwright test e2e/10-requirements/authentication.spec.ts\n\n`;
  readme += `# Run with UI\n`;
  readme += `npx playwright test e2e/10-requirements --ui\n`;
  readme += `\`\`\`\n\n`;
  readme += `## Implementation Status\n\n`;
  readme += `See \`REQUIREMENTS_STATUS.md\` for current implementation status.\n`;
  
  return readme;
}

// Run
try {
  generate();
} catch (error) {
  console.error(`\n❌ Error: ${error.message}`);
  console.error(error);
  process.exit(1);
}

