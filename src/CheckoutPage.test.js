import { render, screen } from '@testing-library/react';
import CheckoutPage from './CheckoutPage';

describe('CheckoutPage', () => {
  it('renders the checkout form, summary, and payment options', () => {
    render(
      <CheckoutPage
        items={[{ id: '1', name: 'White Suit', price: '$180', quantity: 1, image: 'test.jpg', category: 'Suits' }]}
        cartItemsCount={1}
        onBackToCart={() => {}}
        onBackToHome={() => {}}
        onPlaceOrder={() => {}}
      />
    );

    expect(screen.getByLabelText(/delivery address/i)).toBeInTheDocument();
    expect(screen.getByText(/shipping/i)).toBeInTheDocument();
    expect(screen.getByText(/place order/i)).toBeInTheDocument();
    expect(screen.getByText(/credit card/i)).toBeInTheDocument();
  });
});
