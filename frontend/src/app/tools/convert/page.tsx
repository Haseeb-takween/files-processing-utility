import ToolPage from '@/components/tools/ToolPage';

export default function ConvertPage() {
  return (
    <ToolPage
      title="Convert"
      description="Convert between PDF and other formats: images to PDF, PDF to images, or PDF to an editable Word document."
      endpoint="convert"
      multiple
      accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg"
      fields={[
        {
          name: 'direction',
          label: 'Conversion',
          type: 'select',
          defaultValue: 'images-to-pdf',
          options: [
            { value: 'images-to-pdf', label: 'Images → PDF' },
            { value: 'pdf-to-images', label: 'PDF → Images (ZIP of PNGs)' },
            { value: 'pdf-to-word', label: 'PDF → Word (text only)' },
          ],
          help: 'Images → PDF: upload one or more JPEG/PNG. PDF → Images / PDF → Word: upload a single PDF.',
        },
        {
          name: 'dpi',
          label: 'Image resolution (DPI)',
          type: 'number',
          defaultValue: '150',
          min: 72,
          max: 300,
          step: 1,
          help: 'Used only for PDF → Images. Higher is sharper but produces larger files (72–300).',
        },
      ]}
    />
  );
}
