// src/components/DragDrop.tsx
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";

interface DragDropProps {
  onFileAccepted: (file: File | null, previewUrl: string) => void;
  label: string;
  acceptedTypes?: string[];
  currentPreview?: string | null;
}

export default function DragDrop({
  onFileAccepted,
  label,
  acceptedTypes = ["image/jpeg", "image/png"],
  currentPreview = null,
}: DragDropProps) {
  const [preview, setPreview] = useState<string | null>(currentPreview);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      onFileAccepted(file, previewUrl);
    },
    [onFileAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: Object.fromEntries(acceptedTypes.map((type) => [type, []])),
    maxFiles: 1,
  });

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const clearSelection = () => {
    setPreview(null);
    onFileAccepted(null, "");
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div
        {...getRootProps()}
        className={`w-full p-2 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors min-h-80 text-center 
          flex items-center justify-center ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-blue-400"
          }`}
      >
        <input {...getInputProps()} />
        {preview ? (
          <div className="relative w-full min-h-80">
            <Image
              src={preview}
              alt="Aperçu"
              fill
              className="object-contain"
              unoptimized // Required for blob URLs
            />
          </div>
        ) : (
          <p className="text-gray-500">
            {isDragActive
              ? "Déposez l'image ici"
              : `Glissez-déposez ${label} ici, ou cliquez pour sélectionner`}
          </p>
        )}
      </div>
      {preview && (
        <div className="flex w-full flex-row-reverse">
          <button
            onClick={clearSelection}
            className="px-4 py-2 text-sm bg-red-500 text-white hover:bg-red-600 transition-colors rounded cursor-pointer w-full"
          >
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}
