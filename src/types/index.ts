export interface NessiePackage {
  pip_name: string;
  repo: string;
}

export interface NessiePlugin {
  name: string;
  description: string;
  repo: string;
}

export interface NessieServer {
  name: string;
  description: string;
  repo: string;
}

export interface PluginType {
  name: string;
  description: string;
  template: string;
}

export interface NessieConfig {
  nessie_plugins_prefix: string;
  templates_repo: string;
  packages: {
    nessie_api: NessiePackage;
    nessie_platform: NessiePackage;
  };
  plugins: NessiePlugin[];
  servers: NessieServer[];
  plugin_types: PluginType[];
}
