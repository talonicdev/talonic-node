import type { RawSection } from '../types';

export const sections: RawSection[] = [
  {
    slug: 'cli-usage',
    parentSlug: 'cli',
    title: 'CLI Usage',
    seoTitle: 'CLI — Talonic Node SDK',
    description: 'Use the talonic CLI to list schemas, manage documents, and extract data directly from the terminal.',
    content: [
      { type: 'paragraph', text: 'The package ships with a `talonic` binary for terminal-based workflows.' },
      { type: 'code', language: 'bash', title: 'Examples', code: `talonic schemas list
talonic documents list --per-page=20
talonic extract ./invoice.pdf \\
  --schema='{"vendor_name":"string","total_amount":"number"}'
talonic --help` },
      { type: 'paragraph', text: 'The CLI reads `TALONIC_API_KEY` from the environment. All output is JSON by default.' },
    ],
    related: [
      { label: 'Install', slug: 'install' },
      { label: 'Extract', slug: 'extract' },
    ],
    faq: [
      { question: 'Does the Talonic SDK include a CLI?', answer: 'Yes. The talonic binary ships with @talonic/node and supports schema listing, document management, and extraction from the terminal.' },
    ],
    mentions: ['CLI', 'terminal', 'talonic binary'],
  },
];
