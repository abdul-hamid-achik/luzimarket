import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TinaProvider, TinaCMS } from 'tinacms';
import { createClient } from 'tinacms/dist/client';
import * as queries from '../tina/__generated__/client';
import { AuthProvider } from "./context/auth_context";

console.log('Application is starting to render...');

const queryClient = new QueryClient();
// TinaCMS setup
const cms = new TinaCMS({
  api: {
    admin: createClient({
      url: '/admin/graphql',
      queries,
    }),
  },
  sidebar: true,
  enabled: true,
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <TinaProvider cms={cms}>
    <React.StrictMode>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </AuthProvider>
    </React.StrictMode>
  </TinaProvider>
);
