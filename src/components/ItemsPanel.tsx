import { Plus, Scale, Tag, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import type { WheelItem } from '../types';
import { parseTags, sanitizeWeight, tagsEqual } from '../utils/data';

interface ItemsPanelProps {
  items: WheelItem[];
  visibleItems: WheelItem[];
  filterActive: boolean;
  nextItemId: number;
  onAddItem: (name: string, tags: string[], weight: number) => string;
  onUpdateItem: (item: WheelItem, changes: Partial<WheelItem>) => void;
  onDeleteItem: (item: WheelItem) => void;
}

export function ItemsPanel({
  items,
  visibleItems,
  filterActive,
  nextItemId,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: ItemsPanelProps) {
  const [name, setName] = useState('');
  const [tags, setTags] = useState('');
  const [weight, setWeight] = useState('');
  const [status, setStatus] = useState('');
  const [statusTone, setStatusTone] = useState<'success' | 'danger' | ''>('');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    const parsedWeight = weight.trim() ? Number(weight) : 1;

    if (!cleanName) {
      setStatus('Enter an item name.');
      setStatusTone('danger');
      return;
    }

    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      setStatus('Weight must be greater than zero.');
      setStatusTone('danger');
      return;
    }

    setStatus(onAddItem(cleanName, parseTags(tags), sanitizeWeight(parsedWeight, 1)));
    setStatusTone('success');
    setName('');
    setTags('');
    setWeight('');
  };

  const commitName = (item: WheelItem, value: string) => {
    const next = value.trim();
    if (!next) {
      setStatus('Item name cannot be empty.');
      setStatusTone('danger');
      return;
    }
    if (next !== item.name) onUpdateItem(item, { name: next });
  };

  const commitTags = (item: WheelItem, value: string) => {
    const next = parseTags(value);
    if (!tagsEqual(item.tags, next)) onUpdateItem(item, { tags: next });
  };

  const commitWeight = (item: WheelItem, value: string) => {
    const parsed = Number(value);
    if (!value.trim() || !Number.isFinite(parsed) || parsed <= 0) {
      setStatus('Weight must be greater than zero.');
      setStatusTone('danger');
      return;
    }
    if (parsed !== item.weight) onUpdateItem(item, { weight: parsed });
  };

  return (
    <section className="panel-content">
      <form className="add-item-form" onSubmit={submit}>
        <div className="field-grid">
          <label>
            <span>Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder={`Item ${nextItemId}`} />
          </label>
          <label>
            <span>Tags</span>
            <div className="input-with-icon compact-input">
              <Tag size={15} aria-hidden="true" />
              <input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="team, prize" />
            </div>
          </label>
          <label>
            <span>Weight</span>
            <div className="input-with-icon compact-input">
              <Scale size={15} aria-hidden="true" />
              <input
                type="number"
                min="0.0001"
                step="0.01"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                placeholder="1"
              />
            </div>
          </label>
        </div>
        <button className="button primary" type="submit">
          <Plus size={17} aria-hidden="true" />
          Add item
        </button>
      </form>

      {status && <p className={`inline-status ${statusTone}`}>{status}</p>}

      <div className="item-list" aria-live="polite">
        {!items.length || !visibleItems.length ? (
          <div className="empty-state">
            {!items.length
              ? 'No items yet.'
              : filterActive
                ? 'No items match the active filter.'
                : 'No visible items.'}
          </div>
        ) : (
          visibleItems.map((item) => (
            <article className="item-card" key={item.id}>
              <input
                aria-label={`Name for ${item.name}`}
                defaultValue={item.name}
                onBlur={(event) => commitName(item, event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur();
                }}
              />
              <input
                aria-label={`Tags for ${item.name}`}
                defaultValue={item.tags.join(', ')}
                placeholder="Tags"
                onBlur={(event) => commitTags(item, event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur();
                }}
              />
              <input
                aria-label={`Weight for ${item.name}`}
                type="number"
                min="0.0001"
                step="0.01"
                defaultValue={item.weight}
                onBlur={(event) => commitWeight(item, event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur();
                }}
              />
              <button className="icon-button danger" type="button" onClick={() => onDeleteItem(item)} aria-label={`Delete ${item.name}`}>
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
