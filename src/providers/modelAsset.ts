// Single source of truth for the TFLite model asset.
// Import this constant wherever you need to load/use the model.

// Note: Metro must include 'tflite' in resolver.assetExts.
// Path is relative to this file (src/providers -> src/assets).
export const MODEL_TFLITE = require('../assets/model.tflite');