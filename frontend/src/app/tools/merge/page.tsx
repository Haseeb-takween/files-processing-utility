import ToolPage from '@/components/tools/ToolPage';

export default function MergePage() {
  return (
    <ToolPage
      title="Merge PDFs"
      description="Combine two or more PDF files into a single document."
      endpoint="merge"
      multiple
    />
  );
}
