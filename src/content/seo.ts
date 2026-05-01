import type { NavSection } from './types';

export const SDK_NAV_SECTIONS: NavSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    children: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'install', label: 'Install' },
      { id: 'quickstart', label: 'Quick Start' },
    ],
  },
  {
    id: 'api-surface',
    label: 'API Surface',
    children: [
      { id: 'extract', label: 'Extract' },
      { id: 'documents', label: 'Documents' },
      { id: 'extractions', label: 'Extractions' },
      { id: 'schemas', label: 'Schemas' },
      { id: 'jobs', label: 'Jobs' },
    ],
  },
  {
    id: 'cli',
    label: 'CLI',
    children: [
      { id: 'cli-usage', label: 'Usage' },
    ],
  },
  {
    id: 'configuration',
    label: 'Configuration',
    children: [
      { id: 'client-options', label: 'Client Options' },
      { id: 'retries', label: 'Retries & Backoff' },
    ],
  },
  {
    id: 'errors',
    label: 'Errors',
    children: [
      { id: 'error-classes', label: 'Error Classes' },
      { id: 'error-handling', label: 'Error Handling' },
    ],
  },
  {
    id: 'known-issues',
    label: 'Known Issues',
    children: [
      { id: 'current-limitations', label: 'Current Limitations' },
    ],
  },
];
