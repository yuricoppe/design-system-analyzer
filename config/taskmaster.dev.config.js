module.exports = {
  // Configurações do projeto
  project: {
    name: 'Design System Analyzer',
    type: 'figma-plugin',
    version: '1.0.0'
  },

  // Configurações de desenvolvimento
  development: {
    // Diretórios do projeto
    directories: {
      src: 'src',
      dist: 'dist',
      tests: 'tests'
    },

    // Scripts de desenvolvimento
    scripts: {
      start: 'npm run dev',
      watch: 'npm run watch',
      test: 'npm run test'
    },

    // Configurações do Figma
    figma: {
      pluginId: 'YOUR_DEV_PLUGIN_ID',
      manifestPath: 'manifest.json'
    }
  },

  // Configurações de automação
  automation: {
    // Integração com GitHub
    github: {
      enabled: true,
      repository: 'YOUR_REPOSITORY_URL',
      branch: 'develop'
    },

    // Notificações
    notifications: {
      enabled: true,
      channels: ['slack']
    }
  },

  // Regras de validação
  validation: {
    // Regras de código
    code: {
      typescript: true,
      eslint: true,
      prettier: true
    },

    // Regras de testes
    tests: {
      coverage: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80
      },
      performance: {
        enabled: true,
        thresholds: {
          loadTime: 2000,
          responseTime: 500
        }
      }
    }
  },

  // Configurações de monitoramento
  monitoring: {
    enabled: true,
    tools: ['jest'],
    alerts: {
      errorRate: 0.05,
      responseTime: 500
    }
  }
}; 