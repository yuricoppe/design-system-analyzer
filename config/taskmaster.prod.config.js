module.exports = {
  // Configurações do projeto
  project: {
    name: 'Design System Analyzer',
    type: 'figma-plugin',
    version: '1.0.0'
  },

  // Configurações de produção
  production: {
    // Diretórios do projeto
    directories: {
      src: 'src',
      dist: 'dist',
      tests: 'tests'
    },

    // Scripts de build e deploy
    scripts: {
      build: 'npm run build',
      deploy: 'npm run deploy'
    },

    // Configurações do Figma
    figma: {
      pluginId: 'YOUR_PROD_PLUGIN_ID',
      manifestPath: 'manifest.json'
    }
  },

  // Configurações de automação
  automation: {
    // Integração com GitHub
    github: {
      enabled: true,
      repository: 'YOUR_REPOSITORY_URL',
      branch: 'main'
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
        statements: 90,
        branches: 90,
        functions: 90,
        lines: 90
      },
      performance: {
        enabled: true,
        thresholds: {
          loadTime: 1000,
          responseTime: 300
        }
      }
    }
  },

  // Configurações de monitoramento
  monitoring: {
    enabled: true,
    tools: ['jest', 'cypress'],
    alerts: {
      errorRate: 0.01,
      responseTime: 300
    }
  }
}; 