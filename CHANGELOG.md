# Change Log

All notable changes to the "water-reminder" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [Unreleased]

- Initial release

## [1.1.2] - 
### Version 1.1.2
- **Improved Reliability**: Enhanced error handling and state management
  - Added comprehensive error handling with specific error messages
  - Improved state management with transition protection
  - Better error recovery in async operations
- **Better User Experience**: Smoother transitions between reminder states
  - Added status bar tooltip showing time since last reminder
  - Improved state transitions with proper cleanup
  - Better feedback messages
- **Configuration Validation**: Ensures interval settings are within valid ranges
  - Added validation for reminder intervals (1 minute to 24 hours)
  - Automatic fallback to default values with user notification