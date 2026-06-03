import { Database, History, ListChecks } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Dataset, WheelItem } from '../types';

export type InspectorTab = 'items' | 'datasets' | 'history';

interface InspectorTabsProps {
  activeTab: InspectorTab;
  activeDataset: Dataset;
  visibleItems: WheelItem[];
  onTabChange: (tab: InspectorTab) => void;
  children: ReactNode;
}

const tabs: Array<{ id: InspectorTab; label: string; icon: typeof ListChecks }> = [
  { id: 'items', label: 'Items', icon: ListChecks },
  { id: 'datasets', label: 'Datasets', icon: Database },
  { id: 'history', label: 'History', icon: History },
];

export function InspectorTabs({
  activeTab,
  activeDataset,
  visibleItems,
  onTabChange,
  children,
}: InspectorTabsProps) {
  const counts = {
    items: visibleItems.length,
    datasets: null,
    history: activeDataset.history.length,
  };

  return (
    <aside className="inspector" aria-label="Wheel controls">
      <div className="inspector-header">
        <div>
          <p className="eyebrow">Active dataset</p>
          <h2>{activeDataset.name}</h2>
        </div>
        <span className="dataset-count">{activeDataset.items.length}</span>
      </div>

      <div className="tabs" role="tablist" aria-label="Inspector panels">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const selected = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              className={`tab-button ${selected ? 'active' : ''}`}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon size={16} aria-hidden="true" />
              <span>{tab.label}</span>
              {counts[tab.id] !== null && <span className="tab-count">{counts[tab.id]}</span>}
            </button>
          );
        })}
      </div>

      <div className="panel-scroll" role="tabpanel">
        {children}
      </div>
    </aside>
  );
}
