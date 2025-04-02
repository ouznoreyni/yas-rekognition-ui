// components/WebcamCapture.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import * as BlinkIDSDK from '@microblink/blinkid-in-browser-sdk';

interface WebcamCaptureProps {
  onCapture: (file: File, previewUrl: string) => void;
  currentPreview: string | null;
  onCameraStatusChange: (status: boolean) => void;
  title: string;
}

export const WebcamCapture = ({
  onCapture,
  currentPreview,
  onCameraStatusChange,
  title,
}: WebcamCaptureProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [recognizerRunner, setRecognizerRunner] =
    useState<BlinkIDSDK.RecognizerRunner | null>(null);
  const [videoRecognizer, setVideoRecognizer] =
    useState<BlinkIDSDK.VideoRecognizer | null>(null);

  const startCamera = async () => {
    try {
      if (!BlinkIDSDK.isBrowserSupported()) {
        throw new Error('Votre navigateur ne supporte pas la capture vidéo');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        onCameraStatusChange(true);
      }
    } catch (err) {
      console.error('Erreur de caméra:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      setIsCameraActive(false);
      onCameraStatusChange(false);
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          async (blob) => {
            if (blob) {
              const file = new File([blob], `capture-${Date.now()}.jpg`, {
                type: 'image/jpeg',
              });
              const previewUrl = URL.createObjectURL(blob);
              onCapture(file, previewUrl);
            }
          },
          'image/jpeg',
          0.9
        );
      }
    }
    stopCamera();
  };

  const clearPhoto = () => {
    onCapture(null, '');
    if (currentPreview) {
      URL.revokeObjectURL(currentPreview);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      if (currentPreview) {
        URL.revokeObjectURL(currentPreview);
      }
    };
  }, [currentPreview]);

  return (
    <div className='space-y-2'>
      {isCameraActive ? (
        <div className='relative'>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className='w-full h-auto rounded-lg border border-gray-300'
          />
          <canvas
            ref={canvasRef}
            className='hidden'
          />
          <div className='flex justify-center space-x-4 mt-2'>
            <button
              onClick={capturePhoto}
              className='px-4 py-2 bg-green-500 text-white rounded-lg'
            >
              Capturer
            </button>
            <button
              onClick={stopCamera}
              className='px-4 py-2 bg-red-500 text-white rounded-lg'
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div className='flex flex-col items-center space-y-2'>
          {currentPreview ? (
            <>
              <img
                src={currentPreview}
                alt='Captured ID'
                className='w-full h-auto rounded-lg border border-gray-300'
              />
              <div className='flex space-x-2'>
                <button
                  onClick={startCamera}
                  className='px-4 py-2 bg-blue-500 text-white rounded-lg'
                >
                  Reprendre
                </button>
                <button
                  onClick={clearPhoto}
                  className='px-4 py-2 bg-gray-500 text-white rounded-lg'
                >
                  Effacer
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={startCamera}
              className='px-4 py-2 bg-blue-500 text-white rounded-lg w-full'
            >
              {title}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
