// jest.config.js
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts?$': ['ts-jest', { useESM: true }],
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  // Fija la base de datos de tests antes de que se importe nada del proyecto
  setupFiles: ['<rootDir>/__tests__/setup/entorno-test.ts'],
    // Cierra la conexión de Prisma al terminar TODA la ejecución, no
    // cada fichero: con --runInBand comparten proceso y cerrarla antes de
    // tiempo obligaba a reconectar en mitad de la suite.
    globalTeardown: '<rootDir>/__tests__/setup/cierre.ts',
};