import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TinaProvider, TinaCMS } from 'tinacms';
import { createClient } from 'tinacms/dist/client';
import queries from '@/tina/__generated__/client';
import { AuthProvider } from "./context/auth_context";

console.log('Application is starting to render...');
// Only activate TinaCMS in development
const isDev = import.meta.env.DEV;

const queryClient = new QueryClient();
// TinaCMS setup
const cms = isDev
  ? new TinaCMS({
    api: {
      admin: createClient({
        url: '/admin/graphql',
        queries,
      }),
    },
    sidebar: true,
    enabled: true,
  })
  : null;

// Core app component
const AppComponent = (
  <React.StrictMode>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </AuthProvider>
  </React.StrictMode>
);

// Render with TinaProvider only in development
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  isDev && cms ? <TinaProvider cms={cms}>{AppComponent}</TinaProvider> : AppComponent
);
