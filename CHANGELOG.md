# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.1.0] - 2026-03-01

### Changed
- Refactored state management from `useStudioState` hook to `StudioContext` using React Context API to eliminate extensive prop drilling.
- Extracted data persistence and Supabase synchronization logic to `src/utils/storage.ts` for better separation of concerns.
- Reorganized application architecture to use a centralized Context Provider, allowing components to consume state via the `useStudio` hook.
- Updated all test suites to support the new Context-based architecture.

### Added
- release workflow (`.github/workflows/release.yml`) to automate test, build, packaging, and GitHub release publication.

## [1.0.0] - 2026-02-27

### Added
- Initial release of Minato Writing Studio.
