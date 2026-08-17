export interface Repository {
  id: string;
  name: string;
  status: 'Ready' | 'Indexing' | 'Syncing' | 'Failed' | string;
  lastSync?: string;
  knowledgeNodes?: number;
  docPages?: number;
  githubUrl?: string;
  connectedAt?: string;
}

export interface DocSection {
  id: string;
  title: string;
  content: string;
}

export interface QueryResult {
  id: string;
  question: string;
  answer: string;
  sources: { title: string; category: string; path: string }[];
  timestamp: string;
}
