import { Check, Download, FileJson, Plus, Trash2, Upload } from 'lucide-react';
import { ChangeEvent, useRef, useState } from 'react';
import type { Dataset } from '../types';
import { datasetExportPayload, downloadJson, normalizeImportedDataset, plural } from '../utils/data';

interface DatasetsPanelProps {
  datasets: Dataset[];
  activeDatasetId: string;
  onAddDataset: () => void;
  onRenameDataset: (datasetId: string, name: string) => void;
  onSetActiveDataset: (datasetId: string) => void;
  onDeleteDataset: (dataset: Dataset) => void;
  onImportDataset: (dataset: Dataset, fileName: string) => void;
  onExportDataset: (dataset: Dataset) => void;
}

export function DatasetsPanel({
  datasets,
  activeDatasetId,
  onAddDataset,
  onRenameDataset,
  onSetActiveDataset,
  onDeleteDataset,
  onImportDataset,
  onExportDataset,
}: DatasetsPanelProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState('');
  const [statusTone, setStatusTone] = useState<'success' | 'danger' | ''>('');

  const importFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      try {
        const payload = JSON.parse(String(readerEvent.target?.result || ''));
        const dataset = normalizeImportedDataset(file.name, payload);
        if (!dataset) {
          setStatus('Invalid JSON format.');
          setStatusTone('danger');
          return;
        }
        onImportDataset(dataset, file.name);
        setStatus(`Imported ${plural(dataset.items.length, 'item')}.`);
        setStatusTone('success');
      } catch {
        setStatus('Failed to parse JSON file.');
        setStatusTone('danger');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <section className="panel-content">
      <div className="panel-actions">
        <button className="button primary" type="button" onClick={onAddDataset}>
          <Plus size={17} aria-hidden="true" />
          New dataset
        </button>
        <button className="button secondary" type="button" onClick={() => inputRef.current?.click()}>
          <Upload size={17} aria-hidden="true" />
          Import
        </button>
        <input ref={inputRef} className="sr-only" type="file" accept=".json,application/json" onChange={importFile} />
      </div>

      {status && <p className={`inline-status ${statusTone}`}>{status}</p>}

      <div className="dataset-list">
        {datasets.map((dataset) => {
          const active = dataset.id === activeDatasetId;
          return (
            <article className={`dataset-card ${active ? 'active' : ''}`} key={dataset.id}>
              <div className="dataset-main">
                <FileJson size={18} aria-hidden="true" />
                <input
                  aria-label={`Dataset name ${dataset.name}`}
                  defaultValue={dataset.name}
                  onBlur={(event) => onRenameDataset(dataset.id, event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.currentTarget.blur();
                  }}
                />
              </div>
              <span className="dataset-meta">{plural(dataset.items.length, 'item')}</span>
              <div className="dataset-actions">
                <button
                  className={`icon-button ${active ? 'success' : ''}`}
                  type="button"
                  disabled={active}
                  onClick={() => onSetActiveDataset(dataset.id)}
                  aria-label={active ? `${dataset.name} is active` : `Use ${dataset.name}`}
                >
                  <Check size={17} aria-hidden="true" />
                </button>
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => {
                    downloadJson(`${(dataset.name || 'dataset').replace(/[^\w-]+/g, '_')}.json`, datasetExportPayload(dataset));
                    onExportDataset(dataset);
                  }}
                  aria-label={`Export ${dataset.name}`}
                >
                  <Download size={17} aria-hidden="true" />
                </button>
                <button className="icon-button danger" type="button" onClick={() => onDeleteDataset(dataset)} aria-label={`Delete ${dataset.name}`}>
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
