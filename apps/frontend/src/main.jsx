import React from "react";
import ReactDOM from "react-dom/client";
import { TinaProvider, TinaCMS } from 'tinacms';
import { createClient } from 'tinacms/dist/client';
import queries from '@tina/__generated__/client';
import AppComponent from './app';

console.log('Application is starting to render...');
// Only activate TinaCMS in development
const isDev = import.meta.env.DEV;
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

// Render with TinaProvider only in development
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  isDev && cms ? <TinaProvider cms={cms}>{AppComponent}</TinaProvider> : AppComponent
);
