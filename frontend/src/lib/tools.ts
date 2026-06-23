import { ToolInfo } from '@/types';

export const PDF_TOOLS: ToolInfo[] = [
  {
    name: 'Merge',
    slug: 'merge',
    description: 'Combine two or more PDF files into one document.',
    href: '/tools/merge',
  },
  {
    name: 'Split',
    slug: 'split',
    description: 'Split a PDF by page range or extract specific pages.',
    href: '/tools/split',
  },
  {
    name: 'Compress',
    slug: 'compress',
    description: 'Reduce PDF file size.',
    href: '/tools/compress',
  },
  {
    name: 'Convert',
    slug: 'convert',
    description: 'PDF to Word, Images to PDF, or PDF to Images.',
    href: '/tools/convert',
  },
  {
    name: 'Add / Remove Pages',
    slug: 'pages',
    description: 'Insert a blank page or remove a specific page.',
    href: '/tools/pages',
  },
  {
    name: 'Watermark',
    slug: 'watermark',
    description: 'Add a text watermark across PDF pages.',
    href: '/tools/watermark',
  },
];
