import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { BottomNav } from '../BottomNav';

describe('BottomNav', () => {
  it('renders all navigation tabs', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <BottomNav />
      </MemoryRouter>
    );

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('highlights the active tab', () => {
    render(
      <MemoryRouter initialEntries={['/tasks']}>
        <BottomNav />
      </MemoryRouter>
    );

    const tasksTab = screen.getByText('Tasks');
    expect(tasksTab).toHaveStyle({ color: 'var(--green-5)' });
  });
});