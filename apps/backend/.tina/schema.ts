import { defineSchema, TinaField } from 'tinacms';

export default defineSchema({
  collections: [
    {
      label: 'Pages',
      name: 'page',
      path: 'content/pages',
      fields: [
        { type: 'string', name: 'title', label: 'Title' },
        { type: 'rich-text', name: 'body', label: 'Body' },
      ] as TinaField[],
    },
    {
      label: 'Products',
      name: 'product',
      path: 'content/products',
      fields: [
        { type: 'string', name: 'name', label: 'Name' },
        { type: 'string', name: 'description', label: 'Description' },
        { type: 'number', name: 'price', label: 'Price' },
        { type: 'image', name: 'image', label: 'Image' },
      ] as TinaField[],
    },
  ],
});