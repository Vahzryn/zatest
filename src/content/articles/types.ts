export type ArticleCategory = 'formats' | 'privacy' | 'workflows' | 'performance';

export interface CategoryInfo {
  id: ArticleCategory;
  slug: ArticleCategory;
  title: string;
  shortTitle: string;
  badge: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  iconName: string;
  relatedTools: Array<{ path: string; label: string; description: string }>;
}

export interface ToolCallout {
  title: string;
  description: string;
  targetPath: string;
  buttonText: string;
  badge?: string;
}

export type ArticleSection = 
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 2 | 3; id: string; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'code'; code: string; lang?: string; title?: string }
  | { type: 'callout'; title: string; text: string; variant?: 'info' | 'warning' | 'tip' }
  | { type: 'toolCallout'; tool: ToolCallout }
  | { type: 'table'; headers: string[]; rows: string[][] };

export interface Article {
  slug: string;
  category: ArticleCategory;
  title: string;
  metaTitle: string;
  metaDescription: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified: string;
  readTime: string;
  featuredImage?: string;
  headings: Array<{ id: string; text: string; level: number }>;
  sections: ArticleSection[];
  relatedTools: Array<{ path: string; label: string; description: string }>;
  relatedArticleSlugs: string[];
}
