import ToolPage from '@/components/tools/ToolPage';

export default function PagesPage() {
  return (
    <ToolPage
      title="Add / Remove Pages"
      description="Add a blank page or remove a specific page from a PDF."
      endpoint="pages"
    />
  );
}
