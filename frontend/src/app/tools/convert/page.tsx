import ToolPage from '@/components/tools/ToolPage';

export default function ConvertPage() {
  return (
    <ToolPage
      title="Convert"
      description="Convert between PDF, Word, and image formats."
      endpoint="convert"
    />
  );
}
