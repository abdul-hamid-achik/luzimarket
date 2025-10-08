import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface PaymentFailedEmailProps {
  orderNumber: string;
  customerName: string;
  amount: string;
  currency: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
  retryUrl: string;
}

export const PaymentFailedEmail = ({
  orderNumber,
  customerName,
  amount,
  currency = 'MXN',
  items = [],
  retryUrl,
}: PaymentFailedEmailProps) => {
  const previewText = `Payment failed for order ${orderNumber}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={`${process.env.NEXT_PUBLIC_APP_URL}/images/logos/logo-simple.png`}
            width="150"
            height="50"
            alt="Luzimarket"
            style={logo}
          />

          <Heading style={h1}>Payment Failed</Heading>

          <Text style={text}>
            Hi {customerName},
          </Text>

          <Text style={text}>
            Unfortunately, we were unable to process your payment for order <strong>{orderNumber}</strong>.
          </Text>

          <Section style={orderSection}>
            <Text style={orderTitle}>Order Summary:</Text>
            {items.map((item, index) => (
              <Text key={index} style={orderItem}>
                {item.name} × {item.quantity} - ${item.price} {currency}
              </Text>
            ))}
            <Hr style={hr} />
            <Text style={orderTotal}>
              Total: ${amount} {currency}
            </Text>
          </Section>

          <Text style={text}>
            Don't worry! Your items are still reserved. You can retry your payment using the button below:
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={retryUrl}>
              Retry Payment
            </Button>
          </Section>

          <Text style={text}>
            If you continue to experience issues, please contact our support team at{' '}
            <Link href="mailto:support@luzimarket.com" style={link}>
              support@luzimarket.com
            </Link>
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            This email was sent by Luzimarket. If you have any questions,
            please don't hesitate to contact us.
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default PaymentFailedEmail;

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const logo = {
  margin: '0 auto',
  marginBottom: '24px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  padding: '0',
  margin: '30px 0',
  textAlign: 'center' as const,
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
};

const orderSection = {
  backgroundColor: '#f4f4f5',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
};

const orderTitle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: 'bold',
  marginBottom: '12px',
};

const orderItem = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '4px 0',
};

const orderTotal = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  marginTop: '12px',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#000',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const link = {
  color: '#2563eb',
  textDecoration: 'underline',
};

const hr = {
  borderColor: '#e5e5e5',
  margin: '20px 0',
};

const footer = {
  color: '#999',
  fontSize: '12px',
  lineHeight: '16px',
  marginTop: '32px',
};