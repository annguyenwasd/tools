import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CSVImportDialog from '../CSVImportDialog';

describe('CSVImportDialog', () => {
  it('shows error on invalid CSV', async () => {
    render(
      <CSVImportDialog open={true} onClose={vi.fn()} onImport={vi.fn()} />
    );
    const file = new File(['FormattedID,Description\nUS1,desc'], 'test.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText('No "Name" column detected in CSV')).toBeInTheDocument();
    });
  });

  it('shows preview table after successful parse', async () => {
    render(
      <CSVImportDialog open={true} onClose={vi.fn()} onImport={vi.fn()} />
    );
    const csv = 'FormattedID,Name,Description,PlanEstimate\nUS1,Login,desc,5';
    const file = new File([csv], 'test.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('US1')).toBeInTheDocument();
    });
  });

  it('import button disabled with no stories', () => {
    render(
      <CSVImportDialog open={true} onClose={vi.fn()} onImport={vi.fn()} />
    );
    const importBtn = screen.getByRole('button', { name: /import/i });
    expect(importBtn).toBeDisabled();
  });

  it('calls onImport with parsed stories', async () => {
    const onImport = vi.fn();
    render(
      <CSVImportDialog open={true} onClose={vi.fn()} onImport={onImport} />
    );
    const csv = 'Name\nStory A\nStory B';
    const file = new File([csv], 'test.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText('Story A')).toBeInTheDocument();
    });
    const importBtn = screen.getByRole('button', { name: /import 2 stories/i });
    fireEvent.click(importBtn);
    expect(onImport).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Story A' }),
        expect.objectContaining({ name: 'Story B' }),
      ])
    );
  });

  it('resets on close', async () => {
    const { rerender } = render(
      <CSVImportDialog open={true} onClose={vi.fn()} onImport={vi.fn()} />
    );
    // Upload a file
    const csv = 'Name\nStory A';
    const file = new File([csv], 'test.csv', { type: 'text/csv' });
    const input = document.querySelector('input[type="file"]');
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => {
      expect(screen.getByText('Story A')).toBeInTheDocument();
    });
    // Close the dialog via cancel
    fireEvent.click(screen.getByText('Cancel'));
  });
});
