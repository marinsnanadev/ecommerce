import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import CheckoutPage from './CheckoutPage';
import { CheckoutError } from './accountApi';

const BASE_ITEMS = [{ id: 'red-suit', name: 'Red Suit', price: 220, quantity: 1, image: 'test.jpg', category: 'Suits' }];

describe('CheckoutPage', () => {
  it('renders the checkout form, summary, and payment options', () => {
    render(
      <CheckoutPage
        items={[{ id: '1', name: 'White Suit', price: 180, quantity: 1, image: 'test.jpg', category: 'Suits' }]}
        cartItemsCount={1}
        onBackToCart={() => {}}
        onBackToHome={() => {}}
        onPlaceOrder={() => {}}
      />
    );

    expect(screen.getByText(/delivery address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/street, number/i)).toBeInTheDocument();
    expect(screen.getByText(/shipping/i)).toBeInTheDocument();
    expect(screen.getByText(/place order/i)).toBeInTheDocument();
    expect(screen.getByText(/credit card/i)).toBeInTheDocument();
  });

  it('shows a price-change notice with the old/new prices, and resubmits with confirm_price_changes when accepted', async () => {
    const onPlaceOrder = jest.fn()
      .mockRejectedValueOnce(new CheckoutError({
        code: 'PRICE_CHANGED',
        message: 'The price of one or more items changed. Review and confirm to continue.',
        changes: [{ product_id: 'red-suit', old_price: 220, new_price: 275 }],
      }))
      .mockResolvedValueOnce({});

    render(
      <CheckoutPage
        items={BASE_ITEMS}
        cartItemsCount={1}
        onBackToCart={() => {}}
        onBackToHome={() => {}}
        onPlaceOrder={onPlaceOrder}
      />
    );

    fireEvent.click(screen.getByText(/^place order$/i));

    await waitFor(() => {
      expect(screen.getByText(/price changed for these items/i)).toBeInTheDocument();
    });
    const priceChangeNotice = screen.getByText(/price changed for these items/i).closest('.checkout-warning-notice');
    expect(within(priceChangeNotice).getByText(/red suit/i)).toBeInTheDocument();
    // "Place order" is hidden while the price-change notice is showing, so
    // the customer can't accidentally submit the stale price again.
    expect(screen.queryByText(/^place order$/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/accept new prices and continue/i));

    await waitFor(() => {
      expect(onPlaceOrder).toHaveBeenCalledTimes(2);
    });
    expect(onPlaceOrder.mock.calls[1][0]).toEqual(
      expect.objectContaining({ confirm_price_changes: true })
    );

    // Same attempt, same key — that's what lets the backend dedupe a retry.
    const firstKey = onPlaceOrder.mock.calls[0][1];
    const secondKey = onPlaceOrder.mock.calls[1][1];
    expect(firstKey).toBeTruthy();
    expect(secondKey).toBe(firstKey);
  });

  it('shows a removed-product notice and lets the customer go back to the bag', async () => {
    const onBackToCart = jest.fn();
    const onPlaceOrder = jest.fn().mockRejectedValue(new CheckoutError({
      code: 'PRODUCT_REMOVED',
      message: 'One or more items in your cart are no longer available. Please remove them to continue.',
      product_ids: ['red-suit'],
    }));

    render(
      <CheckoutPage
        items={BASE_ITEMS}
        cartItemsCount={1}
        onBackToCart={onBackToCart}
        onBackToHome={() => {}}
        onPlaceOrder={onPlaceOrder}
      />
    );

    fireEvent.click(screen.getByText(/^place order$/i));

    await waitFor(() => {
      expect(screen.getByText(/no longer available/i)).toBeInTheDocument();
    });
    const removedNotice = screen.getByText(/no longer available/i).closest('.checkout-warning-notice');
    expect(within(removedNotice).getByText(/red suit/i)).toBeInTheDocument();

    fireEvent.click(within(removedNotice).getByText(/back to bag/i));
    expect(onBackToCart).toHaveBeenCalledTimes(1);
  });

  it('shows a plain error message for a generic checkout failure', async () => {
    const onPlaceOrder = jest.fn().mockRejectedValue(new Error('Cart is empty'));

    render(
      <CheckoutPage
        items={BASE_ITEMS}
        cartItemsCount={1}
        onBackToCart={() => {}}
        onBackToHome={() => {}}
        onPlaceOrder={onPlaceOrder}
      />
    );

    fireEvent.click(screen.getByText(/^place order$/i));

    await waitFor(() => {
      expect(screen.getByText('Cart is empty')).toBeInTheDocument();
    });
  });
});