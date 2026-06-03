import { Download, RotateCcw, Trophy } from 'lucide-react';
import type { Dataset, HistoryEntry } from '../types';
import { downloadJson } from '../utils/data';

interface HistoryPanelProps {
  dataset: Dataset;
  onClearHistory: () => void;
}

function renderEntry(entry: HistoryEntry) {
  switch (entry.type) {
    case 'spin':
      return {
        title: `Winner: ${String(entry.payload.winner || 'Unknown')}`,
        details: [
          entry.payload.poolCount ? `Pool ${entry.payload.poolCount}` : '',
          entry.payload.totalWeight ? `Weight ${Number(entry.payload.totalWeight).toFixed(2)}` : '',
          Array.isArray(entry.payload.filteredBy) && entry.payload.filteredBy.length
            ? `Filter ${entry.payload.filteredBy.join(', ')}`
            : '',
        ]
          .filter(Boolean)
          .join(' / '),
      };
    case 'add_item':
      return { title: `Added: ${String(entry.payload.name || '')}`, details: `Weight ${entry.payload.weight || 1}` };
    case 'rename_item':
      return { title: 'Renamed item', details: `${entry.payload.from || ''} -> ${entry.payload.to || ''}` };
    case 'update_tags':
      return {
        title: `Updated tags: ${String(entry.payload.name || '')}`,
        details: Array.isArray(entry.payload.tags) && entry.payload.tags.length ? entry.payload.tags.join(', ') : 'No tags',
      };
    case 'update_weight':
      return {
        title: `Updated weight: ${String(entry.payload.name || '')}`,
        details: `${entry.payload.from || ''} -> ${entry.payload.to || ''}`,
      };
    case 'delete_item':
      return { title: `Deleted: ${String(entry.payload.name || '')}`, details: '' };
    case 'import_items':
      return { title: 'Imported items', details: `${entry.payload.itemCount || 0} items` };
    case 'export_items':
      return { title: 'Exported items', details: `${entry.payload.itemCount || 0} items` };
    default:
      return { title: entry.type, details: '' };
  }
}

export function HistoryPanel({ dataset, onClearHistory }: HistoryPanelProps) {
  return (
    <section className="panel-content">
      <div className="panel-actions">
        <button
          className="button secondary"
          type="button"
          disabled={!dataset.history.length}
          onClick={() => downloadJson('spinWheelHistory.json', dataset.history)}
        >
          <Download size={17} aria-hidden="true" />
          Export
        </button>
        <button className="button secondary danger-text" type="button" disabled={!dataset.history.length} onClick={onClearHistory}>
          <RotateCcw size={17} aria-hidden="true" />
          Clear
        </button>
      </div>

      <div className="history-list">
        {!dataset.history.length ? (
          <div className="empty-state">No history yet.</div>
        ) : (
          dataset.history.map((entry) => {
            const rendered = renderEntry(entry);
            return (
              <article className="history-card" key={entry.id}>
                <div className="history-icon" aria-hidden="true">
                  <Trophy size={17} />
                </div>
                <div>
                  <strong>{rendered.title}</strong>
                  {rendered.details && <p>{rendered.details}</p>}
                  <time>{entry.time}</time>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
