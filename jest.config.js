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
  // Cierra la conexión de Prisma al terminar cada fichero
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup/cierre.ts'],
};