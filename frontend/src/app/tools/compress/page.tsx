import ToolPage from '@/components/tools/ToolPage';

export default function CompressPage() {
  return (
    <ToolPage
      title="Compress PDF"
      description="Reduce the file size of your PDF."
      endpoint="compress"
    />
  );
}
