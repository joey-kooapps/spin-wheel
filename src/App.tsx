import { useEffect, useMemo, useReducer, useState } from 'react';
import { Github, Zap } from 'lucide-react';
import { ConfirmDialog } from './components/ConfirmDialog';
import { DatasetsPanel } from './components/DatasetsPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { InspectorTabs, type InspectorTab } from './components/InspectorTabs';
import { ItemsPanel } from './components/ItemsPanel';
import { WheelStage } from './components/WheelStage';
import { appReducer, getActiveDataset } from './state/appState';
import { loadAppState, saveAppState } from './state/storage';
import type { ConfirmRequest, Dataset, WheelItem, WinnerResult } from './types';
import { createHistory, getVisibleItems, makeDataset, parseTags } from './utils/data';
import './styles.css';

function spinHistory(winner: WinnerResult) {
  return createHistory('spin', {
    winner: winner.item.name,
    weight: winner.item.weight,
    tags: [...winner.item.tags],
    filteredBy: [...winner.filteredBy],
    poolCount: winner.poolCount,
    totalWeight: winner.totalWeight,
  });
}

export default function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, loadAppState);
  const [activeTab, setActiveTab] = useState<InspectorTab>('items');
  const [filterInput, setFilterInput] = useState('');
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const activeDataset = getActiveDataset(state);
  const visibleItems = useMemo(
    () => getVisibleItems(activeDataset.items, state.filterTags),
    [activeDataset.items, state.filterTags],
  );

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  const addDataset = () => {
    const dataset = makeDataset(`Dataset ${state.datasets.length + 1}`);
    dispatch({ type: 'add-dataset', dataset });
    setActiveTab('items');
  };

  const importDataset = (dataset: Dataset, fileName: string) => {
    dispatch({
      type: 'import-dataset',
      dataset,
      history: createHistory('import_items', { itemCount: dataset.items.length, fileName }),
    });
    setActiveTab('items');
  };

  const addItem = (name: string, tags: string[], weight: number) => {
    const item: WheelItem = {
      id: activeDataset.currentId,
      name,
      tags,
      weight,
    };
    dispatch({
      type: 'add-item',
      item,
      history: createHistory('add_item', { name, tags, weight }),
    });
    return `Added "${name}".`;
  };

  const updateItem = (item: WheelItem, changes: Partial<WheelItem>) => {
    let history;
    if (changes.name && changes.name !== item.name) {
      history = createHistory('rename_item', { from: item.name, to: changes.name });
    } else if (changes.tags && changes.tags.join('|') !== item.tags.join('|')) {
      history = createHistory('update_tags', { name: item.name, tags: changes.tags });
    } else if (changes.weight != null && changes.weight !== item.weight) {
      history = createHistory('update_weight', { name: item.name, from: item.weight, to: changes.weight });
    }

    dispatch({ type: 'update-item', itemId: item.id, changes, history });
  };

  const applyFilter = () => {
    dispatch({ type: 'set-filter-tags', tags: parseTags(filterInput) });
  };

  const clearFilter = () => {
    setFilterInput('');
    dispatch({ type: 'clear-filter' });
  };

  const confirmAction = () => {
    if (!confirmRequest) return;

    if (confirmRequest.kind === 'dataset') {
      dispatch({ type: 'delete-dataset', datasetId: confirmRequest.datasetId });
      setActiveTab('datasets');
    }

    if (confirmRequest.kind === 'item') {
      dispatch({
        type: 'delete-item',
        itemId: confirmRequest.itemId,
        history: createHistory('delete_item', { name: confirmRequest.label }),
      });
    }

    if (confirmRequest.kind === 'history') {
      dispatch({ type: 'clear-history' });
    }

    setConfirmRequest(null);
  };

  const dialogCopy = (() => {
    if (!confirmRequest) {
      return {
        title: '',
        message: '',
        confirmLabel: '',
      };
    }

    if (confirmRequest.kind === 'dataset') {
      return {
        title: 'Delete dataset?',
        message: `"${confirmRequest.label}" and its saved items/history will be removed from this browser.`,
        confirmLabel: 'Delete dataset',
      };
    }

    if (confirmRequest.kind === 'history') {
      return {
        title: 'Clear history?',
        message: `All history entries for "${confirmRequest.label}" will be removed.`,
        confirmLabel: 'Clear history',
      };
    }

    return {
      title: 'Delete item?',
      message: `"${confirmRequest.label}" will be removed from the active wheel.`,
      confirmLabel: 'Delete item',
    };
  })();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <Zap size={23} fill="currentColor" />
          </div>
          <div>
            <p className="eyebrow">GitHub Pages ready</p>
            <span className="brand-name">Spin Wheel</span>
          </div>
        </div>
        <a className="github-link" href="https://github.com/joey-kooapps/spin-wheel" target="_blank" rel="noreferrer">
          <Github size={18} aria-hidden="true" />
          <span>Source</span>
        </a>
      </header>

      <main className="workspace">
        <WheelStage
          allItems={activeDataset.items}
          visibleItems={visibleItems}
          filterTags={state.filterTags}
          filterInput={filterInput}
          winner={state.winner}
          onFilterInputChange={setFilterInput}
          onApplyFilter={applyFilter}
          onClearFilter={clearFilter}
          onClearWinner={() => dispatch({ type: 'clear-winner' })}
          onWinner={(winner) => dispatch({ type: 'record-spin', winner, history: spinHistory(winner) })}
        />

        <InspectorTabs
          activeTab={activeTab}
          activeDataset={activeDataset}
          visibleItems={visibleItems}
          onTabChange={setActiveTab}
        >
          {activeTab === 'items' && (
            <ItemsPanel
              items={activeDataset.items}
              visibleItems={visibleItems}
              filterActive={state.filterTags.length > 0}
              nextItemId={activeDataset.currentId}
              onAddItem={addItem}
              onUpdateItem={updateItem}
              onDeleteItem={(item) => setConfirmRequest({ kind: 'item', itemId: item.id, label: item.name })}
            />
          )}

          {activeTab === 'datasets' && (
            <DatasetsPanel
              datasets={state.datasets}
              activeDatasetId={state.activeDatasetId}
              onAddDataset={addDataset}
              onRenameDataset={(datasetId, name) => dispatch({ type: 'rename-dataset', datasetId, name })}
              onSetActiveDataset={(datasetId) => dispatch({ type: 'set-active-dataset', datasetId })}
              onDeleteDataset={(dataset) =>
                setConfirmRequest({ kind: 'dataset', datasetId: dataset.id, label: dataset.name })
              }
              onImportDataset={importDataset}
              onExportDataset={(dataset) => {
                if (dataset.id === state.activeDatasetId) {
                  dispatch({
                    type: 'record-history',
                    history: createHistory('export_items', { itemCount: dataset.items.length }),
                  });
                }
              }}
            />
          )}

          {activeTab === 'history' && (
            <HistoryPanel
              dataset={activeDataset}
              onClearHistory={() => setConfirmRequest({ kind: 'history', label: activeDataset.name })}
            />
          )}
        </InspectorTabs>
      </main>

      <ConfirmDialog
        open={confirmRequest !== null}
        title={dialogCopy.title}
        message={dialogCopy.message}
        confirmLabel={dialogCopy.confirmLabel}
        onCancel={() => setConfirmRequest(null)}
        onConfirm={confirmAction}
      />
    </div>
  );
}
