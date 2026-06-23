import ToolPage from '@/components/tools/ToolPage';

export default function PagesPage() {
  return (
    <ToolPage
      title="Add / Remove Pages"
      description="Insert a blank page or remove a specific page from a PDF."
      endpoint="pages"
      accept="application/pdf,.pdf"
      fields={[
        {
          name: 'action',
          label: 'Action',
          type: 'select',
          defaultValue: 'add',
          options: [
            { value: 'add', label: 'Add a blank page' },
            { value: 'remove', label: 'Remove a page' },
          ],
        },
        {
          name: 'pageNumber',
          label: 'Page number',
          type: 'number',
          min: 0,
          placeholder: 'e.g. 2',
          required: true,
          help: 'Add: inserts a blank page after this page (use 0 for the start). Remove: deletes this page.',
        },
      ]}
    />
  );
}
