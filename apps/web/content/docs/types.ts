export type DocsDocSection =
  | {
      type: 'heading';
      level: 2 | 3;
      text: string;
      id?: string;
    }
  | {
      type: 'paragraph';
      text: string;
    }
  | {
      type: 'list';
      items: string[];
    }
  | {
      type: 'code';
      language: string;
      code: string;
      title?: string;
    }
  | {
      type: 'quote';
      text: string;
    }
  | {
      type: 'links';
      title?: string;
      links: Array<{
        label: string;
        href: string;
        external?: boolean;
      }>;
    };

export interface DocsDocSource {
  category: string;
  slug: string;
  title: string;
  summary: string;
  order: number;
  updatedAt: string;
  signatureQuote?: string;
  sections: DocsDocSection[];
}

export interface DocsCategoryConfig {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface CollectedHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface CollectedDoc extends DocsDocSource {
  _meta: {
    path: string;
  };
  headings: CollectedHeading[];
}
