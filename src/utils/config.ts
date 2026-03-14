import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { NessieConfig } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let _config: NessieConfig | null = null;

export function getConfig(): NessieConfig {
  if (_config) return _config;

  const require = createRequire(import.meta.url);
  // Walk up from dist/utils or src/utils to find the config
  const configPath = join(__dirname, '..', 'config', 'nessie.config.json');
  _config = require(configPath) as NessieConfig;
  return _config;
}
