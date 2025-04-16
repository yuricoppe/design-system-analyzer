module.exports = {
  // Configurações do projeto
  project: {
    name: 'Design System Analyzer',
    type: 'figma-plugin',
    version: '1.0.0'
  },

  // Configurações de homologação
  staging: {
    // Diretórios do projeto
    directories: {
      src: 'src',
      dist: 'dist',
      tests: 'tests'
    },

    // Scripts de build e teste
    scripts: {
      build: 'npm run build:staging',
      test: 'npm run test:staging'
    },

    // Configurações do Figma
    figma: {
      pluginId: 'YOUR_STAGING_PLUGIN_ID',
      manifestPath: 'manifest.json'
    }
  },

  // Configurações de automação
  automation: {
    // Integração com GitHub
    github: {
      enabled: true,
      repository: 'YOUR_REPOSITORY_URL',
      branch: 'staging'
    },

    // Notificações
    notifications: {
      enabled: true,
      channels: ['slack', 'email']
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
        statements: 85,
        branches: 85,
        functions: 85,
        lines: 85
      },
      performance: {
        enabled: true,
        thresholds: {
          loadTime: 1500,
          responseTime: 400
        }
      }
    }
  },

  // Configurações de monitoramento
  monitoring: {
    enabled: true,
    tools: ['jest', 'cypress'],
    alerts: {
      errorRate: 0.03,
      responseTime: 400
    }
  }
}; 