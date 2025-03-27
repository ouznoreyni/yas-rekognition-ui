import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";

interface CameraCaptureProps {
  onCapture: (file: File, previewUrl: string) => void;
  currentPreview?: string | null;
  onCameraStatusChange: (status: boolean) => void;
}

export default function CameraCapture({
  onCapture,
  currentPreview,
  onCameraStatusChange,
}: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(
    currentPreview ?? null
  );

  const capture = useCallback(async () => {
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;

    setCapturedPreview(imageSrc);
    const blob = await fetch(imageSrc).then((res) => res.blob());
    const file = new File([blob], "captured.jpg", { type: "image/jpeg" });
    onCapture(file, imageSrc);
    setIsCameraOn(false);
    onCameraStatusChange(false);
  }, [onCapture, onCameraStatusChange]);

  const toggleCamera = () => {
    const newStatus = !isCameraOn;
    setIsCameraOn(newStatus);
    onCameraStatusChange(newStatus);
    if (!newStatus) setCapturedPreview(null);
  };

  return (
    <div className="space-y-4">
      {capturedPreview ? (
        <div className="flex flex-col items-center space-y-4">
          <Image
            src={capturedPreview}
            alt="Aperçu capturé"
            className="w-full object-contain rounded-lg"
            width={500}
            height={500}
          />
          <div className="flex w-full flex-row-reverse">
            <button
              onClick={toggleCamera}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Reprendre la photo
            </button>
          </div>
        </div>
      ) : isCameraOn ? (
        <div className="space-y-4">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full rounded-lg"
          />
          <div className="flex justify-center space-x-4">
            <button
              onClick={toggleCamera}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Fermer la caméra
            </button>
            <button
              onClick={capture}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Capturer la photo
            </button>
          </div>
        </div>
      ) : (
        <div className="flex w-full flex-row-reverse">
          <button
            onClick={toggleCamera}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Prendre une photo
          </button>
        </div>
      )}
    </div>
  );
}
