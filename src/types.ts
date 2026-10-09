export interface WishData {
  wish: string;
  timestamp: number;
  dateStr: string;
}

export interface WishItem {
  id: string;
  wish: string;
  timestamp: number;
  dateStr: string;
  x?: number;
  y?: number;
  color?: string;
  rotation?: number;
}


export interface MemoryLeaf {
  id: number;
  tag: string;
  message: string;
  category: 'compliment' | 'memory' | 'wish' | 'humor' | 'blessing';
  color: string;
  x: number; // percentage in tree canopy
  y: number; // percentage in tree canopy
  scale?: number;
  rotation?: number;
}
