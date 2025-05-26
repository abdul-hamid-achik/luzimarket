import React, { createContext, useContext } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Load Stripe with your publishable key from environment variables
// In development, you can set VITE_STRIPE_PUBLISHABLE_KEY in your .env file
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    'pk_test_51QZqQ3P3rlpid8wJMj5sAVuKZzqQ3ep-rapid-water-a44emd3-pooler.us-east-1.aws.neon.tech'; // Fallback for development

console.log('Stripe publishable key configured:', stripePublishableKey ? 'Yes' : 'No');

const stripePromise = loadStripe(stripePublishableKey);

const StripeContext = createContext();

export const useStripe = () => {
    const context = useContext(StripeContext);
    if (!context) {
        throw new Error('useStripe must be used within a StripeProvider');
    }
    return context;
};

export const StripeProvider = ({ children }) => {
    const options = {
        // Stripe Elements options
        appearance: {
            theme: 'stripe',
            variables: {
                colorPrimary: '#0570de',
                colorBackground: '#ffffff',
                colorText: '#30313d',
                colorDanger: '#df1b41',
                fontFamily: 'Ideal Sans, system-ui, sans-serif',
                spacingUnit: '2px',
                borderRadius: '4px',
            },
        },
    };

    // If no Stripe key is configured, show a warning but still render children
    if (!stripePublishableKey || stripePublishableKey.includes('your_key_here')) {
        console.warn('Stripe publishable key not configured. Payment functionality will not work.');
        return (
            <StripeContext.Provider value={{ stripePromise: null, configured: false }}>
                {children}
            </StripeContext.Provider>
        );
    }

    return (
        <Elements stripe={stripePromise} options={options}>
            <StripeContext.Provider value={{ stripePromise, configured: true }}>
                {children}
            </StripeContext.Provider>
        </Elements>
    );
}; 