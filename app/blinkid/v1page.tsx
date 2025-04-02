"use client";

import * as BlinkIDSDK from "@microblink/blinkid-in-browser-sdk";
import Head from "next/head";
import { useEffect, useState } from "react";
import { CameraCapture, DragDrop } from "../components";
import { IdVerificationResult } from "../components/IdVerificationResult";

interface ProcessingResult {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dateOfBirth?: string;
  documentNumber?: string;
  expiryDate?: string;
}

export default function BlinkIDPage() {
  const [recto, setRecto] = useState<File | null>(null);
  const [verso, setVerso] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [targetPreview, setTargetPreview] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [processingResult, setProcessingResult] =
    useState<ProcessingResult | null>(null);
  const [isMounted, setIsMounted] = useState(false); // Track client-side mounting

  // Mark component as mounted on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialisation du SDK BlinkID
  const initializeBlinkID = async () => {
    if (!BlinkIDSDK.isBrowserSupported()) {
      throw new Error("Navigateur non supporté");
    }

    const licenseKey = process.env.NEXT_PUBLIC_BLINKID_LICENSE_KEY;
    const loadSettings = new BlinkIDSDK.WasmSDKLoadSettings(licenseKey!);
    loadSettings.engineLocation = "/resources";
    loadSettings.workerLocation = "/resources/BlinkIDWasmSDK.worker.min.js";

    return await BlinkIDSDK.loadWasmModule(loadSettings);
  };

  // Conversion File en ImageFrame
  const fileToImageFrame = async (
    file: File
  ): Promise<BlinkIDSDK.CapturedFrame> => {
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    URL.revokeObjectURL(url);
    return BlinkIDSDK.captureFrame(img);
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  };

  // Traitement des images
  const processID = async (frontImage: File, backImage: File) => {
    const sdk = await initializeBlinkID();
    const multiSideRecognizer =
      await BlinkIDSDK.createBlinkIdMultiSideRecognizer(sdk);
    const recognizerRunner = await BlinkIDSDK.createRecognizerRunner(
      sdk,
      [multiSideRecognizer],
      false
    );

    try {
      const frontFrame = await fileToImageFrame(frontImage);
      const backFrame = await fileToImageFrame(backImage);

      await recognizerRunner.processImage(frontFrame);
      const result = await recognizerRunner.processImage(backFrame);

      if (result !== BlinkIDSDK.RecognizerResultState.Empty) {
        const results = await multiSideRecognizer.getResult();
        console.log("Résultats de la reconnaissance :", results);
        return parseResults(results);
      }
      throw new Error("Impossible de lire le document");
    } finally {
      recognizerRunner?.delete();
      multiSideRecognizer?.delete();
    }
  };

  // Extraction des données
  const parseResults = (
    results: BlinkIDSDK.BlinkIdSingleSideRecognizerResult
  ) => {
    return results; // Simplified for now; add parsing logic as needed
  };

  const handleSourceImage = (file: File | null, previewUrl: string) => {
    setRecto(file);
    setSourcePreview(file ? previewUrl : null);
    setResult(null);
    setError(null);
  };

  const handleTargetImage = (file: File | null, previewUrl: string) => {
    setVerso(file);
    setTargetPreview(file ? previewUrl : null);
    setResult(null);
    setError(null);
  };

  const handleCameraStatusChange = (status: boolean) => {
    setIsCameraOn(status);
  };

  const handleCompare = async () => {
    if (!recto || !verso) {
      setError("Veuillez fournir les deux côtés de la pièce d'identité");
      return;
    }

    setIsLoading(true);
    setError(null);
    setProcessingResult(null);

    try {
      const result = await processID(recto, verso);
      setProcessingResult(result);
      setResult("Vérification réussie !");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors de la vérification"
      );
      console.error("Erreur BlinkID:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (sourcePreview) URL.revokeObjectURL(sourcePreview);
      if (targetPreview) URL.revokeObjectURL(targetPreview);
    };
  }, [sourcePreview, targetPreview]);

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
            {/* Recto */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Recto de la Carte d'Identité
              </h2>
              {!isCameraOn && (
                <DragDrop
                  onFileAccepted={handleSourceImage}
                  label="Déposez le recto ici"
                  currentPreview={sourcePreview}
                />
              )}
              <CameraCapture
                onCapture={(file, preview) => handleSourceImage(file, preview)}
                currentPreview={sourcePreview}
                onCameraStatusChange={handleCameraStatusChange}
                title="Prendre une photo du recto"
              />
            </div>

            {/* Verso */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Verso de la Carte d'Identité
              </h2>
              <DragDrop
                onFileAccepted={handleTargetImage}
                label="Déposez le verso ici"
                currentPreview={targetPreview}
              />
              <CameraCapture
                onCapture={(file, preview) => handleTargetImage(file, preview)}
                currentPreview={targetPreview}
                onCameraStatusChange={handleCameraStatusChange}
                title="Prendre une photo du verso"
              />
            </div>
          </div>

          {/* Bouton de vérification */}
          <button
            onClick={handleCompare}
            disabled={!recto || !verso || isLoading}
            className={`px-6 py-3 rounded-lg w-full font-medium text-white ${
              !recto || !verso || isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } transition-colors`}
          >
            {isLoading ? "Analyse en cours..." : "Vérifier mon identité"}
          </button>

          {/* Affichage des résultats */}
          {isMounted && processingResult && (
            <IdVerificationResult processingResult={processingResult} />
          )}

          {/* Affichage des erreurs */}
          {isMounted && error && (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg">
              ❌ Erreur : {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
