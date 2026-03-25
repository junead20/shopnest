// client/src/pages/Checkout.js
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { FaRupeeSign, FaTruck, FaMapMarkerAlt, FaCreditCard } from 'react-icons/fa';
import api from '../services/api';
import { createOrder } from '../store/slices/orderSlice';
import { clearCart } from '../store/slices/cartSlice';
import { formatINR } from '../utils/currency';

// The Stripe publishable key must be outside of a component's render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { cartItems, shippingAddress } = useSelector((state) => state.cart);

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState('');

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shipping = subtotal > 500 ? 0 : 40;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  useEffect(() => {
    const getClientSecret = async () => {
      try {
        setProcessing(true);
        const { data } = await api.post('/payment/create-payment-intent', {
          amount: total
        });
        setClientSecret(data.clientSecret);
        setProcessing(false);
      } catch (err) {
        setError('Failed to initialize payment system. Please check your connection.');
        setProcessing(false);
      }
    };

    if (total > 0) {
      getClientSecret();
    }
  }, [total]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);

    if (!stripe || !elements) {
      return;
    }

    const cardElement = elements.getElement(CardElement);

    try {
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user.name,
            email: user.email,
            address: {
              line1: shippingAddress.address,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postal_code: shippingAddress.zipCode,
              country: shippingAddress.country || 'IN'
            }
          }
        }
      });

      if (paymentError) {
        setError(paymentError.message);
        setProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Create order
        const orderData = {
          orderItems: cartItems.map(item => ({
            name: item.name,
            qty: item.qty,
            price: item.price,
            product: item.product,
            image: item.image
          })),
          shippingAddress: {
            fullName: shippingAddress.fullName,
            address: shippingAddress.address,
            city: shippingAddress.city,
            state: shippingAddress.state,
            zipCode: shippingAddress.zipCode,
            country: shippingAddress.country,
            phoneNumber: shippingAddress.phoneNumber
          },
          paymentMethod: 'Stripe',
          itemsPrice: subtotal,
          taxPrice: tax,
          shippingPrice: shipping,
          totalPrice: total,
          paymentResult: {
            id: paymentIntent.id,
            status: paymentIntent.status,
            update_time: paymentIntent.created,
            email_address: user.email
          }
        };

        const order = await dispatch(createOrder(orderData)).unwrap();
        dispatch(clearCart());
        navigate(`/order-success/${order._id}`);
      }
    } catch (err) {
      setError('Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const CARD_ELEMENT_OPTIONS = {
    style: {
      base: {
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4'
        }
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a'
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="mb-6">
        <label className="block text-gray-700 font-semibold mb-2">
          Card Details
        </label>
        <div className="border rounded-lg p-4 bg-white">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing || !clientSecret}
        className={`w-full py-3 px-6 rounded-lg text-white font-semibold ${!stripe || processing || !clientSecret
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-yellow-500 hover:bg-yellow-600'
          }`}
      >
        {processing ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            {clientSecret ? 'Processing...' : 'Initializing...'}
          </div>
        ) : (
          `Pay ${formatINR(total)}`
        )}
      </button>
    </form>
  );
};

const Checkout = () => {
  const { user } = useSelector((state) => state.auth);
  const { cartItems, shippingAddress } = useSelector((state) => state.cart);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (cartItems.length === 0) {
      navigate('/cart');
    } else if (!shippingAddress.address) {
      navigate('/shipping');
    }
  }, [user, cartItems, shippingAddress, navigate]);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const shipping = subtotal > 500 ? 0 : 40;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaTruck className="text-yellow-500" />
              Order Summary
            </h2>

            <div className="space-y-2 mb-4">
              {cartItems.map(item => (
                <div key={item.product} className="flex justify-between text-sm">
                  <span>{item.name} x {item.qty}</span>
                  <span>{formatINR(item.price * item.qty)}</span>
                </div>
              ))}

              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : formatINR(shipping)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span>{formatINR(tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg mt-2">
                  <span>Total</span>
                  <span className="text-yellow-600">{formatINR(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-gray-50 p-6 rounded-lg mt-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaMapMarkerAlt className="text-red-500" />
              Shipping Address
            </h2>
            <p className="font-semibold">{shippingAddress.fullName}</p>
            <p>{shippingAddress.address}</p>
            <p>{shippingAddress.city}, {shippingAddress.state} - {shippingAddress.zipCode}</p>
            <p>{shippingAddress.country}</p>
            <p className="mt-2">Phone: {shippingAddress.phoneNumber}</p>
          </div>
        </div>

        {/* Payment Form */}
        <div>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FaCreditCard className="text-blue-500" />
              Payment
            </h2>
            {total > 0 && cartItems.length > 0 ? (
              <Elements stripe={stripePromise}>
                <CheckoutForm />
              </Elements>
            ) : (
              <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg font-medium text-center">
                Your cart is empty or the payment amount is invalid. Please return to the shop.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;