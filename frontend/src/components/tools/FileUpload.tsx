'use client';

import { ChangeEvent } from 'react';

interface FileUploadProps {
  label?: string;
  multiple?: boolean;
  accept?: string;
  onChange: (files: FileList | null) => void;
}

export default function FileUpload({
  label = 'Upload file',
  multiple = false,
  accept = '.pdf,image/*',
  onChange,
}: FileUploadProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.files);
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-700">{label}</label>
      <input
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleChange}
        className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
      />
    </div>
  );
}
