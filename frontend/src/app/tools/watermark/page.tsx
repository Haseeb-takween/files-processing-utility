import ToolPage from '@/components/tools/ToolPage';

export default function WatermarkPage() {
  return (
    <ToolPage
      title="Watermark"
      description="Stamp a text watermark across every page of a PDF."
      endpoint="watermark"
      accept="application/pdf,.pdf"
      fields={[
        {
          name: 'text',
          label: 'Watermark text',
          type: 'text',
          placeholder: 'e.g. CONFIDENTIAL',
          required: true,
        },
        {
          name: 'position',
          label: 'Position',
          type: 'select',
          defaultValue: 'diagonal',
          options: [
            { value: 'diagonal', label: 'Diagonal (45°)' },
            { value: 'center', label: 'Horizontal (centered)' },
          ],
        },
        {
          name: 'opacity',
          label: 'Opacity',
          type: 'number',
          defaultValue: '0.3',
          min: 0.05,
          max: 1,
          step: 0.05,
          help: 'Between 0.05 (faint) and 1 (solid).',
        },
      ]}
    />
  );
}
