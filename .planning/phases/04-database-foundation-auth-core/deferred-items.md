# Deferred Items — Phase 04

## Out-of-scope Issues Discovered During Execution

### DiskVideoStore.test.ts fixture mismatch
- **Discovered during:** Phase 04 Plan 04, Task 1
- **File:** `packages/backend/fixtures/metadata.json`
- **Issue:** `metadata.json` references `tree_video.mp4` but the file does not exist in `packages/backend/fixtures/videos/`. Only `placeholder-01.mp4`, `placeholder-02.mp4`, `placeholder-03.mp4` are present.
- **Impact:** 2 `DiskVideoStore.test.ts` tests fail (`getSize()` tests)
- **Fix:** Either rename `placeholder-01.mp4` to `tree_video.mp4` OR update `metadata.json` to reference `placeholder-01.mp4`
- **Priority:** Low (pre-existing issue, does not block auth or feed functionality)
