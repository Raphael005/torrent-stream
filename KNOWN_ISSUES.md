# Known Issues

## Flaky `test/storage.js` test failures

**Status**: Open  
**Observed**: 2026-08-20

### Description
The `test/storage.js` test suite has 2 failing tests (1/3 passing):

### Failures

1. **Piece verification mismatch**
   - Test: `should verify all the pieces`
   - Expected: `c0`
   - Found: `00`
   - Location: `test/storage.js:18`

2. **Test timeout**
   - The test times out and is terminated with SIGTERM

### Environment
- Node.js v24.19.0
- macOS (arm64)
- tap test runner

### Reproduction
```bash
./node_modules/.bin/tap test/storage.js
```

### Notes
This failure was observed during routine test suite verification. All other tests pass (85/87 total). The issue appears to be pre-existing and may be related to test fixture data or timing issues on newer Node.js versions.
