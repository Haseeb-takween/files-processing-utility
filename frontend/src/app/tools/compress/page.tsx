import ToolPage from '@/components/tools/ToolPage';

export default function CompressPage() {
  return (
    <ToolPage
      title="Compress PDF"
      description="Losslessly optimise a PDF's structure to reduce its file size. Savings depend on the file — image-heavy PDFs may not shrink much."
      endpoint="compress"
      accept="application/pdf,.pdf"
    />
  );
}
