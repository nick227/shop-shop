module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'This dependency is part of a circular relationship. You might want to revise your solution (i.e. use dependency inversion, make sure the modules have a single responsibility) ',
      from: {},
      to: {
        circular: true
      }
    },
    {
      name: 'no-orphans',
      comment: "This is an orphan module - it's likely not used (anymore?). Either use it or remove it. If it's logical this module might be used - don't add it to this rule's ignore.",
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: [
          '(^|/)(node_modules|dist|build|coverage|.git)/',
          '\\.d\\.ts$'
        ]
      },
      to: {}
    },
    {
      name: 'no-deprecated-core',
      comment: 'A module depends on a node core module that has been deprecated. Find an alternative - these are bound to exist - node doesn\'t deprecate lightly.',
      severity: 'warn',
      from: {},
      to: {
        dependencyTypes: ['core'],
        path: [
          '^(punycode|domain|constants|sys|_linklist|_stream_wrap)$'
        ]
      }
    },
    {
      name: 'not-to-deprecated',
      comment: 'This module uses a (version of an) npm module that has been deprecated. Either upgrade to a later version of that module, or find an alternative. Deprecated modules are a security risk.',
      severity: 'warn',
      from: {},
      to: {
        dependencyTypes: ['deprecated']
      }
    },
    {
      name: 'no-non-package-json',
      comment: 'This module depends on an npm package that isn\'t in the \'dependencies\' section of your package.json. That\'s problematic as the package either (1) won\'t be available on other machines, or (2) is a transitive dependency you have no control over.',
      severity: 'error',
      from: {},
      to: {
        dependencyTypes: ['npm'],
        pathNot: [
          '^(react|react-dom|@types/.*|typescript)$'
        ]
      }
    },
    {
      name: 'no-unresolved',
      comment: 'This module depends on a module that cannot be found (\'resolved to absolute path\'). Either (1) install it, (2) add it to your package.json or (3) restructure your code to not need it.',
      severity: 'error',
      from: {},
      to: {
        couldNotResolve: true
      }
    },
    {
      name: 'no-feature-to-feature',
      comment: 'Features should not directly import from other features. Use the public API instead.',
      severity: 'error',
      from: {
        path: '^src/features/[^/]+/'
      },
      to: {
        path: '^src/features/[^/]+/',
        pathNot: [
          '^src/features/[^/]+/index\\.ts$',
          '^src/features/[^/]+/types\\.ts$'
        ]
      }
    },
    {
      name: 'no-feature-to-ui-internals',
      comment: 'Features should only import from components/ui public API, not internal files.',
      severity: 'error',
      from: {
        path: '^src/features/'
      },
      to: {
        path: '^src/components/ui/',
        pathNot: [
          '^src/components/ui/index\\.ts$'
        ]
      }
    },
    {
      name: 'no-pages-to-feature-internals',
      comment: 'Pages should only import from feature public APIs, not internal files.',
      severity: 'error',
      from: {
        path: '^src/pages/'
      },
      to: {
        path: '^src/features/[^/]+/',
        pathNot: [
          '^src/features/[^/]+/index\\.ts$',
          '^src/features/[^/]+/types\\.ts$'
        ]
      }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json'
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node']
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+'
      },
      archi: {
        collapsePattern: 'node_modules/[^/]+'
      }
    }
  }
};
