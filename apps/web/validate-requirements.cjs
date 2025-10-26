#!/usr/bin/env node
/**
 * Requirements Validation Script
 * 
 * Analyzes the codebase against requirements.csv to identify:
 * - Implemented features
 * - Missing features
 * - Partially implemented features
 * - Files implementing each requirement
 * 
 * Usage: node validate-requirements.cjs [--category CategoryName] [--verbose]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose');
const categoryFilter = args.find(arg => arg.startsWith('--category='))?.split('=')[1];

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Parse requirements CSV
function parseRequirements() {
  const csvPath = path.join(__dirname, '../../requirement.csv');
  const content = fs.readFileSync(csvPath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim());
  
  const requirements = [];
  for (let i = 1; i < lines.length; i++) {
    const match = lines[i].match(/^([^,]+),([^,]+),"?([^"]+)"?/);
    if (match) {
      const [, id, category, requirement] = match;
      requirements.push({ id: id.trim(), category: category.trim(), requirement: requirement.trim() });
    }
  }
  
  return requirements;
}

// Search keywords mapping for each requirement category
const categoryKeywords = {
  'Authentication & Access Control': [
    'auth', 'login', 'signup', 'session', 'token', 'password', 'mfa', '2fa', 'otp', 'sso', 'role', 'permission'
  ],
  'User Profiles': [
    'profile', 'customer', 'address', 'payment', 'card', 'order history', 'notification', 'preferences'
  ],
  'Multi‑Tenant Orgs & Stores': [
    'tenant', 'organization', 'org', 'multi-tenant', 'isolation', 'store', 'staff', 'invite'
  ],
  'Store Onboarding & Verification': [
    'onboarding', 'verification', 'kyc', 'kyb', 'document', 'approve', 'operating hours', 'service area'
  ],
  'Catalog Management': [
    'catalog', 'item', 'category', 'variant', 'modifier', 'sku', 'bulk', 'import', 'export', 'draft', 'publish'
  ],
  'Inventory & Availability': [
    'inventory', 'stock', 'availability', 'out-of-stock', 'blackout', 'threshold'
  ],
  'Pricing, Taxes & Fees': [
    'price', 'pricing', 'tax', 'fee', 'discount', 'coupon', 'promotion', 'surge'
  ],
  'Cart & Checkout': [
    'cart', 'checkout', 'fulfillment', 'delivery', 'pickup', 'guest', 'validate'
  ],
  'Payments & Payouts': [
    'payment', 'payout', 'stripe', 'card', 'apple pay', 'google pay', 'refund', 'void', 'capture', 'authorize'
  ],
  'Orders & Fulfillment': [
    'order', 'fulfillment', 'status', 'accept', 'reject', 'in-prep', 'ready', 'complete', 'cancel', 'substitution'
  ],
  'Delivery & Pickup': [
    'delivery', 'pickup', 'courier', 'tracking', 'curbside', 'contactless'
  ],
  'Scheduling & SLAs': [
    'schedule', 'sla', 'time window', 'prep time', 'capacity', 'escalate'
  ],
  'Search & Discovery': [
    'search', 'filter', 'sort', 'recommendation', 'popular', 'seo', 'deep link'
  ],
  'Promotions & Loyalty': [
    'promotion', 'loyalty', 'points', 'coupon', 'discount', 'banner', 'upsell'
  ],
  'Reviews & Quality': [
    'review', 'rating', 'feedback', 'nps', 'csat', 'moderation', 'quality'
  ],
  'Customer Support': [
    'support', 'help', 'faq', 'chat', 'ticket', 'case', 'issue', 'report'
  ],
  'Notifications & Messaging': [
    'notification', 'message', 'push', 'sms', 'email', 'realtime', 'websocket'
  ],
  'Analytics & Reporting': [
    'analytics', 'report', 'dashboard', 'metric', 'revenue', 'conversion', 'export'
  ],
  'Admin & Governance': [
    'admin', 'governance', 'audit', 'compliance', 'feature flag', 'policy', 'maintenance'
  ],
  'APIs, Webhooks & Integrations': [
    'api', 'webhook', 'integration', 'rest', 'graphql', 'rate limit', 'pagination'
  ],
};

// Search for implementation evidence
function findImplementationFiles(keywords) {
  const srcPath = path.join(__dirname, 'src');
  const files = [];
  
  function searchDir(dir) {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && entry !== 'node_modules' && entry !== 'dist') {
        searchDir(fullPath);
      } else if (entry.match(/\.(tsx?|jsx?)$/)) {
        const content = fs.readFileSync(fullPath, 'utf8').toLowerCase();
        
        // Check if file contains any keywords
        const hasKeywords = keywords.some(keyword => 
          content.includes(keyword.toLowerCase())
        );
        
        if (hasKeywords) {
          files.push(path.relative(srcPath, fullPath));
        }
      }
    }
  }
  
  searchDir(srcPath);
  return files;
}

// Analyze implementation status
function analyzeRequirement(req) {
  const keywords = categoryKeywords[req.category] || [];
  const files = findImplementationFiles(keywords);
  
  // Additional specific keyword extraction from requirement text
  const reqKeywords = req.requirement.toLowerCase()
    .match(/\b(cart|checkout|payment|order|store|item|user|profile|auth|delivery|pickup|notification|review|search|inventory|catalog)\b/g) || [];
  
  const combinedKeywords = [...new Set([...keywords, ...reqKeywords])];
  const specificFiles = findImplementationFiles(combinedKeywords);
  
  return {
    status: specificFiles.length > 0 ? 'IMPLEMENTED' : 'MISSING',
    confidence: specificFiles.length > 5 ? 'HIGH' : specificFiles.length > 2 ? 'MEDIUM' : specificFiles.length > 0 ? 'LOW' : 'NONE',
    files: specificFiles.slice(0, 5), // Top 5 files
    fileCount: specificFiles.length,
  };
}

// Main validation
function validate() {
  log('\n🔍 Requirements Validation Report', 'cyan');
  log('=' .repeat(80), 'cyan');
  
  const requirements = parseRequirements();
  log(`\n📋 Loaded ${requirements.length} requirements from requirements.csv\n`, 'blue');
  
  // Filter by category if specified
  const filtered = categoryFilter
    ? requirements.filter(r => r.category === categoryFilter)
    : requirements;
  
  if (categoryFilter) {
    log(`🎯 Filtering by category: ${categoryFilter}\n`, 'yellow');
  }
  
  const results = {
    implemented: [],
    partial: [],
    missing: [],
  };
  
  // Analyze each requirement
  filtered.forEach((req) => {
    const analysis = analyzeRequirement(req);
    
    if (analysis.status === 'IMPLEMENTED') {
      if (analysis.confidence === 'HIGH' || analysis.confidence === 'MEDIUM') {
        results.implemented.push({ ...req, ...analysis });
      } else {
        results.partial.push({ ...req, ...analysis });
      }
    } else {
      results.missing.push({ ...req, ...analysis });
    }
  });
  
  // Print summary
  log('📊 Summary by Category', 'cyan');
  log('='.repeat(80), 'cyan');
  
  const categories = [...new Set(filtered.map(r => r.category))];
  categories.forEach((category) => {
    const categoryReqs = filtered.filter(r => r.category === category);
    const implemented = results.implemented.filter(r => r.category === category).length;
    const partial = results.partial.filter(r => r.category === category).length;
    const missing = results.missing.filter(r => r.category === category).length;
    
    const percentage = Math.round((implemented / categoryReqs.length) * 100);
    const color = percentage >= 80 ? 'green' : percentage >= 50 ? 'yellow' : 'red';
    
    log(`\n${category}:`, 'blue');
    log(`  ✅ Implemented: ${implemented}/${categoryReqs.length} (${percentage}%)`, color);
    if (partial > 0) log(`  ⚠️  Partial: ${partial}`, 'yellow');
    if (missing > 0) log(`  ❌ Missing: ${missing}`, 'red');
  });
  
  // Detailed breakdown
  if (VERBOSE) {
    log('\n\n📝 Detailed Breakdown', 'cyan');
    log('='.repeat(80), 'cyan');
    
    log('\n✅ Implemented Features:', 'green');
    results.implemented.forEach((req) => {
      log(`\n${req.id} - ${req.category}`, 'green');
      log(`  ${req.requirement}`, 'reset');
      log(`  Confidence: ${req.confidence} (${req.fileCount} files)`, 'cyan');
      if (req.files.length > 0) {
        log(`  Files: ${req.files.slice(0, 3).join(', ')}`, 'blue');
      }
    });
    
    if (results.partial.length > 0) {
      log('\n\n⚠️  Partially Implemented:', 'yellow');
      results.partial.forEach((req) => {
        log(`\n${req.id} - ${req.category}`, 'yellow');
        log(`  ${req.requirement}`, 'reset');
        log(`  Confidence: ${req.confidence} (${req.fileCount} files)`, 'cyan');
        if (req.files.length > 0) {
          log(`  Files: ${req.files.join(', ')}`, 'blue');
        }
      });
    }
    
    if (results.missing.length > 0) {
      log('\n\n❌ Missing Features:', 'red');
      results.missing.forEach((req) => {
        log(`\n${req.id} - ${req.category}`, 'red');
        log(`  ${req.requirement}`, 'reset');
      });
    }
  }
  
  // Overall stats
  log('\n\n' + '='.repeat(80), 'cyan');
  log('🎯 Overall Status', 'cyan');
  log('='.repeat(80), 'cyan');
  
  const total = filtered.length;
  const implCount = results.implemented.length;
  const partialCount = results.partial.length;
  const missingCount = results.missing.length;
  const overallPercentage = Math.round((implCount / total) * 100);
  
  log(`\n✅ Fully Implemented:  ${implCount}/${total} (${overallPercentage}%)`, 'green');
  log(`⚠️  Partially Implemented: ${partialCount}/${total} (${Math.round((partialCount / total) * 100)}%)`, 'yellow');
  log(`❌ Missing:           ${missingCount}/${total} (${Math.round((missingCount / total) * 100)}%)`, 'red');
  
  log('\n' + '='.repeat(80) + '\n', 'cyan');
  
  // Generate test report
  generateTestReport(requirements, results);
  
  return results;
}

// Generate test report file
function generateTestReport(requirements, results) {
  const reportPath = path.join(__dirname, 'requirements-test-report.md');
  
  let report = `# Requirements Test Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- **Total Requirements**: ${requirements.length}\n`;
  report += `- **Implemented**: ${results.implemented.length} (${Math.round((results.implemented.length / requirements.length) * 100)}%)\n`;
  report += `- **Partial**: ${results.partial.length} (${Math.round((results.partial.length / requirements.length) * 100)}%)\n`;
  report += `- **Missing**: ${results.missing.length} (${Math.round((results.missing.length / requirements.length) * 100)}%)\n\n`;
  
  // By category
  report += `## Status by Category\n\n`;
  const categories = [...new Set(requirements.map(r => r.category))];
  categories.forEach((category) => {
    const categoryReqs = requirements.filter(r => r.category === category);
    const implemented = results.implemented.filter(r => r.category === category).length;
    const partial = results.partial.filter(r => r.category === category).length;
    const missing = results.missing.filter(r => r.category === category).length;
    const percentage = Math.round((implemented / categoryReqs.length) * 100);
    
    report += `### ${category}\n\n`;
    report += `- ✅ Implemented: ${implemented}/${categoryReqs.length} (${percentage}%)\n`;
    report += `- ⚠️  Partial: ${partial}\n`;
    report += `- ❌ Missing: ${missing}\n\n`;
  });
  
  // Detailed listings
  report += `## Detailed Breakdown\n\n`;
  
  report += `### ✅ Implemented (${results.implemented.length})\n\n`;
  results.implemented.forEach((req) => {
    report += `**${req.id}** - ${req.category}\n`;
    report += `> ${req.requirement}\n\n`;
    report += `*Confidence: ${req.confidence}* | *Files: ${req.fileCount}*\n\n`;
  });
  
  report += `\n### ⚠️ Partially Implemented (${results.partial.length})\n\n`;
  results.partial.forEach((req) => {
    report += `**${req.id}** - ${req.category}\n`;
    report += `> ${req.requirement}\n\n`;
    report += `*Files found: ${req.files.join(', ')}*\n\n`;
  });
  
  report += `\n### ❌ Missing (${results.missing.length})\n\n`;
  results.missing.forEach((req) => {
    report += `**${req.id}** - ${req.category}\n`;
    report += `> ${req.requirement}\n\n`;
  });
  
  // Recommendations
  report += `\n## Recommendations\n\n`;
  report += `### High Priority (Missing Core Features)\n\n`;
  
  const highPriority = results.missing.filter(r => 
    r.category.includes('Authentication') ||
    r.category.includes('Payments') ||
    r.category.includes('Orders')
  );
  
  highPriority.forEach((req) => {
    report += `- [ ] **${req.id}**: ${req.requirement}\n`;
  });
  
  report += `\n### Medium Priority (Partial Implementation)\n\n`;
  results.partial.slice(0, 10).forEach((req) => {
    report += `- [ ] **${req.id}**: ${req.requirement}\n`;
  });
  
  fs.writeFileSync(reportPath, report, 'utf8');
  log(`\n📄 Detailed report saved to: requirements-test-report.md`, 'green');
}

// Run validation
try {
  const results = validate();
  
  if (results.missing.length > 20) {
    log(`\n⚠️  Warning: ${results.missing.length} features are missing`, 'yellow');
    log(`Run with --verbose to see detailed breakdown\n`, 'yellow');
  }
  
  process.exit(results.missing.length > 0 ? 1 : 0);
} catch (error) {
  log(`\n❌ Validation failed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
}

