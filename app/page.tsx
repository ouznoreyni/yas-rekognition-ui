'use client';

import Head from 'next/head';
import { useEffect, useState } from 'react';
import { CameraCapture, DragDrop, ResultDisplay } from './components';
import { compareImages, ComparisonResponse } from './service/api';

export default function Home() {
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [targetImage, setTargetImage] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [targetPreview, setTargetPreview] = useState<string | null>(null);
  const [similarityThreshold, setSimilarityThreshold] = useState(70);
  const [result, setResult] = useState<ComparisonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false); // Add camera state

  const handleSourceImage = (file: File | null, previewUrl: string) => {
    setSourceImage(file);
    setSourcePreview(file ? previewUrl : null);
    setResult(null);
    setError(null);
  };

  const handleTargetImage = (file: File | null, previewUrl: string) => {
    setTargetImage(file);
    setTargetPreview(file ? previewUrl : null);
    setResult(null);
    setError(null);
  };

  const handleCameraStatusChange = (status: boolean) => {
    setIsCameraOn(status);
  };

  useEffect(() => {
    return () => {
      if (sourcePreview) URL.revokeObjectURL(sourcePreview);
      if (targetPreview) URL.revokeObjectURL(targetPreview);
    };
  }, [sourcePreview, targetPreview]);

  const handleCompare = async () => {
    if (!sourceImage || !targetImage) {
      setError(
        "Veuillez fournir votre photo faciale et votre carte d'identité"
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const comparisonResult = await compareImages(
        sourceImage,
        targetImage,
        similarityThreshold
      );
      setResult(comparisonResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Une erreur inconnue est survenue'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <Head>
        <title>Yes - Identification Automatique</title>
        <meta
          name='description'
          content="Identification par carte d'identité et reconnaissance faciale"
        />
      </Head>

      <main className='container mx-auto py-8 px-4'>
        <h1> What is Lorem Ipsum?</h1>
        Lorem Ipsum is simply dummy text of the printing and typesetting
        industry. Lorem Ipsum has been the industry's standard dummy text ever
        since the 1500s, when an unknown printer took a galley of type and
        scrambled it to make a type specimen book. It has survived not only five
        centuries, but also the leap into electronic typesetting, remaining
        essentially unchanged. It was popularised in the 1960s with the release
        of Letraset sheets containing Lorem Ipsum passages, and more recently
        with desktop publishing software like Aldus PageMaker including versions
        of Lorem Ipsum.
      </main>
    </div>
  );
}
