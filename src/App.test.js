import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

test('renders the splash screen with VIOLET and opens the storefront when the button is clicked', async () => {
  render(<App />);
  expect(screen.getByText(/violet/i)).toBeInTheDocument();
  expect(screen.getByText(/fashion house/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /enter the page/i }));

  await waitFor(() => {
    expect(screen.getByText(/shop by category/i)).toBeInTheDocument();
  });
});
