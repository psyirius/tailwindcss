import fs from 'fs'
import path from 'path'
import { flagEnabled } from '../featureFlags.js'

function isObject(value) {
  return typeof value === 'object' && value !== null
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0
}

function isString(value) {
  return typeof value === 'string' || value instanceof String
}

/**
 * This will take a possibly-relative path to a config and resolve
 * it relative to the input path IF that config file exists and
 * has the `resolveConfigRelativeToInput` flag enabled.
 *
 * If that file does not exist, or the flag is disabled, it will
 * resolve the path relative to the current working directory.
 *
 * @param {string|undefined} inputPath
 * @param {string} configPath
 * @returns {string}
 */
function pickResolvedPath(configPath, inputPath) {
  if (path.isAbsolute(configPath)) {
    return configPath
  }

  if (inputPath) {
    try {
      // Use require.resolve so we can find config file in parent directories
      return require.resolve(configPath, {
        paths: [path.dirname(inputPath)],
      })
    } catch {}
  }

  return path.resolve(configPath)
}

export default function resolveConfigPath(pathOrConfig, inputPath) {
  // require('tailwindcss')({ theme: ..., variants: ... })
  if (isObject(pathOrConfig) && pathOrConfig.config === undefined && !isEmpty(pathOrConfig)) {
    return null
  }

  // require('tailwindcss')({ config: 'custom-config.js' })
  if (
    isObject(pathOrConfig) &&
    pathOrConfig.config !== undefined &&
    isString(pathOrConfig.config)
  ) {
    // if (pathOrConfig.experimental?.contextualPaths) {
    //   return pickResolvedPath(pathOrConfig.config, inputPath)
    // }

    return path.resolve(pathOrConfig.config)
  }

  // require('tailwindcss')({ config: { theme: ..., variants: ... } })
  if (
    isObject(pathOrConfig) &&
    pathOrConfig.config !== undefined &&
    isObject(pathOrConfig.config)
  ) {
    return null
  }

  // require('tailwindcss')('custom-config.js')
  if (isString(pathOrConfig)) {
    return path.resolve(pathOrConfig)
  }

  // require('tailwindcss')
  for (const configFile of ['./tailwind.config.js', './tailwind.config.cjs']) {
    try {
      const configPath = path.resolve(configFile)
      fs.accessSync(configPath)
      return configPath
    } catch (err) {}
  }

  return null
}
