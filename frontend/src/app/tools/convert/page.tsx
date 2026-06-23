import ToolPage from '@/components/tools/ToolPage';

export default function ConvertPage() {
  return (
    <ToolPage
      title="Convert: Images → PDF"
      description="Combine one or more JPEG/PNG images into a single PDF, one image per page."
      endpoint="convert"
      multiple
      accept="image/png,image/jpeg,.png,.jpg,.jpeg"
      fields={[
        {
          name: 'direction',
          label: 'Conversion',
          type: 'select',
          defaultValue: 'images-to-pdf',
          options: [
            { value: 'images-to-pdf', label: 'Images → PDF' },
          ],
          help: 'PDF → Images and PDF → Word are planned for a future update.',
        },
      ]}
    />
  );
}
