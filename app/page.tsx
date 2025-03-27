"use client";

import Head from "next/head";
import { useEffect, useState } from "react";
import { CameraCapture, DragDrop, ResultDisplay } from "./components";
import { compareImages, ComparisonResponse } from "./service/api";

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
        err instanceof Error ? err.message : "Une erreur inconnue est survenue"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Yes - Identification Automatique</title>
        <meta
          name="description"
          content="Identification par carte d'identité et reconnaissance faciale"
        />
      </Head>

      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Identifiez vous facilement
        </h1>

        <div className="max-w-4xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Source Image Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Votre Photo Faciale</h2>
              {!isCameraOn && (
                <DragDrop
                  onFileAccepted={handleSourceImage}
                  label="votre photo faciale"
                  currentPreview={sourcePreview}
                />
              )}

              <CameraCapture
                onCapture={(file, preview) => handleSourceImage(file, preview)}
                currentPreview={sourcePreview}
                onCameraStatusChange={handleCameraStatusChange}
              />
            </div>

            {/* Target Image Section */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Votre Carte d'Identité</h2>

              <DragDrop
                onFileAccepted={handleTargetImage}
                label="votre carte d'identité"
                currentPreview={targetPreview}
              />
            </div>
          </div>

          <button
            onClick={handleCompare}
            disabled={!sourceImage || !targetImage || isLoading}
            className={`px-6 py-3 rounded-lg w-full font-medium text-white cursor-pointer
 ${
   !sourceImage || !targetImage || isLoading
     ? "bg-gray-400 cursor-not-allowed"
     : "bg-blue-primary"
 }`}
          >
            {isLoading ? "Vérification en cours..." : "Vérifier mon identité"}
          </button>

          <ResultDisplay result={result} isLoading={isLoading} error={error} />
        </div>
      </main>
    </div>
  );
}
