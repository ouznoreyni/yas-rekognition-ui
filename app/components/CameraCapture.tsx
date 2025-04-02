import { useCallback, useRef, useState } from "react";
import Webcam from "react-webcam";

interface CameraCaptureProps {
  onCapture: (file: File, previewUrl: string) => void;
  currentPreview?: string | null;
  onCameraStatusChange: (status: boolean) => void;
  title?: string;
}

export default function CameraCapture({
  onCapture,
  currentPreview,
  onCameraStatusChange,
  title = "Prendre une photo",
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

  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch {
      return false;
    }
  };

  const startCamera = async () => {
    const hasPermission = await checkCameraPermission();
    if (!hasPermission) {
      alert(
        "L'accès à la caméra a été refusé. Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur pour prendre une photo."
      );
      return;
    }

    setIsCameraOn(true);
    onCameraStatusChange(true);
    setCapturedPreview(null);
  };

  const closeCamera = async () => {
    setIsCameraOn(false);
    onCameraStatusChange(false);
    setCapturedPreview(null);
  };

  return (
    <div className="space-y-4">
      {isCameraOn ? (
        <div className="space-y-4">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="w-full rounded-lg"
          />
          <div className="flex justify-center space-x-4">
            <button
              onClick={closeCamera}
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
            onClick={startCamera}
            className="px-4 py-2 bg-yellow-primary text-blue-primary rounded hover:bg-blue-600 transition-colors cursor-pointer"
          >
            {title}
          </button>
        </div>
      )}
    </div>
  );
}
