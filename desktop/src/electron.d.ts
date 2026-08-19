export interface BuildResult {
  ok: boolean;
  title: string;
  id: string;
}

export interface EnvInfo {
  model: string;
  visionModel: string;
  apiKey: string;
  baseUrl: string;
  visionApiKey: string;
  visionBaseUrl: string;
  hasKey: boolean;
  previewUrl: string;
}

export interface EnvConfig {
  model?: string;
  visionModel?: string;
  apiKey?: string;
  baseUrl?: string;
  visionApiKey?: string;
  visionBaseUrl?: string;
}

export interface GeneratedEntry {
  id: string;
  title: string;
  prompt: string;
  hasSpec: boolean;
  appTsx: boolean;
}

export interface UINode {
  type: string;
  props?: Record<string, unknown>;
  children?: UINode[];
}

export interface UISpec {
  title: string;
  root: UINode;
}

declare global {
  interface Window {
    specpulseApi: {
      build: (prompt: string) => Promise<BuildResult>;
      reference: (imagePath: string, additionalPrompt?: string) => Promise<BuildResult>;
      adjust: (id: string, instruction: string) => Promise<BuildResult>;
      getEnv: () => Promise<EnvInfo>;
      saveEnv: (config: EnvConfig) => Promise<{ ok: boolean }>;
      generateStarters: () => Promise<string[]>;
      openExternal: (url: string) => Promise<void>;
      listGenerated: () => Promise<GeneratedEntry[]>;
      loadGenerated: (id: string) => Promise<{ ok: boolean }>;
      deleteGenerated: (id: string) => Promise<{ ok: boolean }>;
      clearGenerated: () => Promise<{ ok: boolean }>;
      exportGenerated: (id: string) => Promise<{ ok: boolean; path: string }>;
      getSpec: (id: string) => Promise<UISpec>;
      saveSpec: (id: string, spec: UISpec) => Promise<{ ok: boolean; title: string }>;
    };
  }
}

export {};
