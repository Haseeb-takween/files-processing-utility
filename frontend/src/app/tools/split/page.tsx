import ToolPage from '@/components/tools/ToolPage';

export default function SplitPage() {
  return (
    <ToolPage
      title="Split PDF"
      description="Extract specific pages or page ranges into a new PDF."
      endpoint="split"
      accept="application/pdf,.pdf"
      fields={[
        {
          name: 'ranges',
          label: 'Pages to extract',
          type: 'text',
          placeholder: 'e.g. 1-3, 5, 8-10',
          required: true,
          help: 'Comma-separated pages or ranges (1-based). Order is preserved.',
        },
      ]}
    />
  );
}
