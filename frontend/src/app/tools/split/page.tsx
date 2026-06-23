import ToolPage from '@/components/tools/ToolPage';

export default function SplitPage() {
  return (
    <ToolPage
      title="Split PDF"
      description="Split a PDF by page range or extract specific pages."
      endpoint="split"
    />
  );
}
