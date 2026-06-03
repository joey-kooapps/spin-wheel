import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from './App';
import { STORAGE_KEY } from './utils/data';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('adds an item and enables the spin flow', async () => {
    render(<App />);

    fireEvent.change(screen.getByPlaceholderText('Item 1'), { target: { value: 'Prize' } });
    fireEvent.change(screen.getByPlaceholderText('team, prize'), { target: { value: 'alpha' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Spin' })).toBeEnabled());
    expect(screen.getByDisplayValue('Prize')).toBeInTheDocument();
    expect(localStorage.getItem(STORAGE_KEY)).toContain('Prize');
  });

  it('applies a filter and uses a dialog for destructive item delete', () => {
    render(<App />);

    fireEvent.change(screen.getByPlaceholderText('Item 1'), { target: { value: 'Prize' } });
    fireEvent.change(screen.getByPlaceholderText('team, prize'), { target: { value: 'alpha' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }));

    fireEvent.change(screen.getByPlaceholderText('Filter tags'), { target: { value: 'alpha' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply tag filter' }));

    expect(screen.getByText(/Showing 1 of 1 item matching alpha/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Prize' }));
    expect(screen.getByRole('dialog', { name: 'Delete item?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Delete item' }));

    expect(screen.getByText('No items yet.')).toBeInTheDocument();
  });
});
