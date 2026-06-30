import { fireEvent, render, screen } from '@testing-library/react';
import App from './App';

test('renders the splash screen with VIOLET and opens the storefront when the button is clicked', () => {
  render(<App />);
  expect(screen.getByText(/violet/i)).toBeInTheDocument();
  expect(screen.getByText(/fashion house/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /enter the page/i }));

  expect(screen.getByText(/shop by category/i)).toBeInTheDocument();
});
