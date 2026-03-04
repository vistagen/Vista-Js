'use client';

import { useSyncExternalStore } from 'react';

interface Heading {
  id: string;
  level: number;
  text: string;
}

interface TableOfContentsState {
  allHeadings: Heading[];
  visibleSections: string[];
  setAllHeadings: (headings: Heading[]) => void;
  setVisibleSections: (visibleSections: string[]) => void;
}

type StoreSnapshot = Omit<TableOfContentsState, 'setAllHeadings' | 'setVisibleSections'>;

const listeners = new Set<() => void>();

const snapshot: StoreSnapshot = {
  allHeadings: [],
  visibleSections: [],
};

function notify(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): StoreSnapshot {
  return snapshot;
}

function setAllHeadings(headings: Heading[]): void {
  const serializedCurrent = JSON.stringify(snapshot.allHeadings);
  const serializedNext = JSON.stringify(headings);
  if (serializedCurrent === serializedNext) return;
  snapshot.allHeadings = headings;
  notify();
}

function setVisibleSections(visibleSections: string[]): void {
  const serializedCurrent = snapshot.visibleSections.join(',');
  const serializedNext = visibleSections.join(',');
  if (serializedCurrent === serializedNext) return;
  snapshot.visibleSections = visibleSections;
  notify();
}

export function useTableOfContents<T>(selector: (state: TableOfContentsState) => T): T {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return selector({
    ...state,
    setAllHeadings,
    setVisibleSections,
  });
}
