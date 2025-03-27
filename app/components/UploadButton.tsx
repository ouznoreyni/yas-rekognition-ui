import { ChangeEvent } from "react";

interface UploadButtonProps {
  onFileChange: (file: File) => void;
  label: string;
  acceptedTypes?: string;
}

export default function UploadButton({
  onFileChange,
  label,
  acceptedTypes = "image/jpeg,image/png",
}: UploadButtonProps) {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileChange(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <label className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors cursor-pointer">
        {label}
        <input
          type="file"
          accept={acceptedTypes}
          onChange={handleFileChange}
          className="hidden"
        />
      </label>
    </div>
  );
}
