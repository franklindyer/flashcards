module.exports = {
  transform: {'^.+\\.ts?$': 'ts-jest'},
  testEnvironment: 'node',
  testRegex: '/tests/.*\\.(test|spec)?\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  silent: false,
  verbose: true,
  moduleNameMapper: {
    "~/(.*)": "<rootDir>/src/$1",
    "^utils/(.*)": "<rootDir>/src/utils/$1",
    "^core/(.*)": "<rootDir>/src/core/$1",
    "^decks/(.*)": "<rootDir>/src/decks/$1"
  },
};
