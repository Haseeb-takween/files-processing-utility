import ToolPage from '@/components/tools/ToolPage';

export default function WatermarkPage() {
  return (
    <ToolPage
      title="Watermark"
      description="Add a custom text watermark to your PDF pages."
      endpoint="watermark"
    />
  );
}
