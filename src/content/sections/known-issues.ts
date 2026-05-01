import type { RawSection } from '../types';

export const sections: RawSection[] = [
  {
    slug: 'current-limitations',
    parentSlug: 'known-issues',
    title: 'Current Limitations',
    seoTitle: 'Known Issues — Talonic Node SDK',
    description: 'Known issues and limitations in the current version of the Talonic Node SDK, including auto-discovery extract and schema format constraints.',
    content: [
      { type: 'list', items: [
        '**Auto-discovery extract (no schema) currently returns 500 on production.** Always provide a `schema` or `schema_id` in v0.1.',
        '**Schema definitions: prefer full JSON Schema for now.** The flat key-type map (`{ vendor_name: "string" }`) is documented as supported but the server-side normaliser does not translate it yet. Send full JSON Schema with `type: "object"` and `properties`.',
        '**`is_not_empty` filter currently underreports.** A filter condition with `operator: "is_not_empty"` may return zero documents even when the field has populated values. Use specific operators (`eq`, `gt`, `contains`, etc.) instead.',
      ]},
      { type: 'callout', variant: 'warning', text: 'These limitations are tracked and will be resolved in upcoming releases. Always pass a `schema` or `schema_id` to `extract()` for reliable results.' },
    ],
    related: [
      { label: 'Extract', slug: 'extract' },
      { label: 'Schemas', slug: 'schemas' },
    ],
    faq: [
      { question: 'Why does extract without a schema return 500?', answer: 'Auto-discovery extraction (no schema) is not yet reliable on production. Always provide a schema or schema_id in v0.1.' },
      { question: 'Should I use flat key-type maps or JSON Schema?', answer: 'Use full JSON Schema with type: "object" and properties. The flat key-type map format is not fully supported server-side yet.' },
    ],
    mentions: ['known issues', 'auto-discovery', 'JSON Schema', 'is_not_empty'],
  },
];
