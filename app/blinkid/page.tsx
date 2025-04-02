"use client";

import * as BlinkIDSDK from "@microblink/blinkid-in-browser-sdk";
import Head from "next/head";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { DragDrop } from "../components";
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
  const [isCameraOnRecto, setIsCameraOnRecto] = useState(false);
  const [isCameraOnVerso, setIsCameraOnVerso] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [processingResult, setProcessingResult] =
    useState<ProcessingResult | null>(null);

  const rectoVideoRef = useRef<HTMLVideoElement>(null);
  const versoVideoRef = useRef<HTMLVideoElement>(null);
  const rectoCanvasRef = useRef<HTMLCanvasElement>(null);
  const versoCanvasRef = useRef<HTMLCanvasElement>(null);

  // Mark component as mounted on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cleanup previews and camera streams on unmount
  useEffect(() => {
    return () => {
      if (sourcePreview) URL.revokeObjectURL(sourcePreview);
      if (targetPreview) URL.revokeObjectURL(targetPreview);
      stopCamera("recto");
      stopCamera("verso");
    };
  }, [sourcePreview, targetPreview]);

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

  // Use native JavaScript Image class
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
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

  // Handlers for DragDrop
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

  // Camera functions
  const startCamera = async (side: "recto" | "verso") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoRef = side === "recto" ? rectoVideoRef : versoVideoRef;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        if (side === "recto") setIsCameraOnRecto(true);
        else setIsCameraOnVerso(true);
      }
    } catch (err) {
      console.error(`Erreur lors de l'accès à la caméra (${side}) :`, err);
      setError("Impossible d'accéder à la caméra");
    }
  };

  const stopCamera = (side: "recto" | "verso") => {
    const videoRef = side === "recto" ? rectoVideoRef : versoVideoRef;
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      if (side === "recto") setIsCameraOnRecto(false);
      else setIsCameraOnVerso(false);
    }
  };

  const captureImage = (side: "recto" | "verso") => {
    const videoRef = side === "recto" ? rectoVideoRef : versoVideoRef;
    const canvasRef = side === "recto" ? rectoCanvasRef : versoCanvasRef;
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `${side}-capture.jpg`, {
              type: "image/jpeg",
            });
            const previewUrl = URL.createObjectURL(file);
            if (side === "recto") handleSourceImage(file, previewUrl);
            else handleTargetImage(file, previewUrl);
            stopCamera(side);
          }
        }, "image/jpeg");
      }
    }
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
              {sourcePreview ? (
                <div>
                  <div className="relative w-full min-h-80 p-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-green-600 hover:border-green-400">
                    <Image
                      src={sourcePreview}
                      alt="Recto preview"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <button
                    onClick={() => handleSourceImage(null, "")}
                    className="w-full mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Retirer l'image
                  </button>
                </div>
              ) : isCameraOnRecto ? (
                <div className="space-y-2">
                  <video
                    ref={rectoVideoRef}
                    autoPlay
                    className="w-full h-auto rounded-lg"
                  />
                  <canvas ref={rectoCanvasRef} className="hidden" />
                  <div className="space-x-2">
                    <button
                      onClick={() => captureImage("recto")}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Prendre la photo
                    </button>
                    <button
                      onClick={() => stopCamera("recto")}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <DragDrop
                    onFileAccepted={handleSourceImage}
                    label="Déposez le recto ici"
                    currentPreview={sourcePreview}
                  />
                  <button
                    onClick={() => startCamera("recto")}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
                  >
                    Prendre une photo
                  </button>
                </div>
              )}
            </div>

            {/* Verso */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Verso de la Carte d'Identité
              </h2>
              {targetPreview ? (
                <div>
                  <div className="relative w-full min-h-80 p-2 border-2 border-dashed rounded-lg cursor-pointer transition-colors border-green-600 hover:border-green-400">
                    <Image
                      src={targetPreview}
                      alt="Verso preview"
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <button
                    onClick={() => handleTargetImage(null, "")}
                    className="w-full mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Retirer l'image
                  </button>
                </div>
              ) : isCameraOnVerso ? (
                <div className="space-y-2">
                  <video
                    ref={versoVideoRef}
                    autoPlay
                    className="w-full h-auto rounded-lg"
                  />
                  <canvas ref={versoCanvasRef} className="hidden" />
                  <div className="space-x-2">
                    <button
                      onClick={() => captureImage("verso")}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      Prendre la photo
                    </button>
                    <button
                      onClick={() => stopCamera("verso")}
                      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <DragDrop
                    onFileAccepted={handleTargetImage}
                    label="Déposez le verso ici"
                    currentPreview={targetPreview}
                  />
                  <button
                    onClick={() => startCamera("verso")}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
                  >
                    Prendre une photo
                  </button>
                </div>
              )}
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
            {isLoading
              ? "Analyse en cours..."
              : "Extraire les informations de la carte"}
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
