'use client';

import * as BlinkIDSDK from '@microblink/blinkid-in-browser-sdk';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { CameraCapture, DragDrop } from '../components';
import { IdVerificationResult } from '../components/IdVerificationResult';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ProcessingResult {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dateOfBirth?: string;
  documentNumber?: string;
  expiryDate?: string;
}

export default function BlinkIDPage() {
  // State for recto (front) side
  const [rectoFile, setRectoFile] = useState<File | null>(null);
  const [rectoPreview, setRectoPreview] = useState<string | null>(null);
  const [isRectoCameraOn, setIsRectoCameraOn] = useState(false);

  // State for verso (back) side
  const [versoFile, setVersoFile] = useState<File | null>(null);
  const [versoPreview, setVersoPreview] = useState<string | null>(null);
  const [isVersoCameraOn, setIsVersoCameraOn] = useState(false);

  // Verification state
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingResult, setProcessingResult] =
    useState<ProcessingResult | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      if (rectoPreview) URL.revokeObjectURL(rectoPreview);
      if (versoPreview) URL.revokeObjectURL(versoPreview);
    };
  }, [rectoPreview, versoPreview]);

  const initializeBlinkID = async () => {
    try {
      if (!BlinkIDSDK.isBrowserSupported()) {
        throw new Error(
          "Votre navigateur n'est pas supporté. Veuillez utiliser Chrome, Firefox, Edge ou Safari."
        );
      }

      const licenseKey = process.env.NEXT_PUBLIC_BLINKID_LICENSE_KEY;
      if (!licenseKey) {
        throw new Error("La clé de licence n'est pas configurée.");
      }

      const loadSettings = new BlinkIDSDK.WasmSDKLoadSettings(licenseKey);
      loadSettings.engineLocation = '/resources';
      loadSettings.workerLocation = '/resources/BlinkIDWasmSDK.worker.min.js';

      // Configuration optimisée
      loadSettings.allowHelloMessage = true;
      loadSettings.enableWasm = true;
      loadSettings.wasmType = BlinkIDSDK.WasmType.Basic;

      return await BlinkIDSDK.loadWasmModule(loadSettings);
    } catch (err) {
      console.error("Erreur d'initialisation:", err);
      throw new Error("Échec de l'initialisation du SDK BlinkID");
    }
  };

  const handleRectoCapture = (file: File | null, previewUrl: string) => {
    setRectoFile(file);
    setRectoPreview(file ? previewUrl : null);
    setResult(null);
    setError(null);
  };

  const handleVersoCapture = (file: File | null, previewUrl: string) => {
    setVersoFile(file);
    setVersoPreview(file ? previewUrl : null);
    setResult(null);
    setError(null);
  };

  const fileToImageFrame = async (
    file: File
  ): Promise<BlinkIDSDK.CapturedFrame> => {
    try {
      const url = URL.createObjectURL(file);
      const img = await loadImage(url);
      URL.revokeObjectURL(url);

      if (img.width === 0 || img.height === 0) {
        throw new Error("Dimensions de l'image invalides");
      }

      const frame = BlinkIDSDK.captureFrame(img);
      frame.orientation = BlinkIDSDK.ImageOrientation.Normal;
      return frame;
    } catch (err) {
      console.error("Erreur de traitement d'image:", err);
      throw new Error("Échec du traitement de l'image");
    }
  };

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Échec du chargement de l'image"));
      img.src = src;
    });
  };

  const processID = async (frontImage: File, backImage: File) => {
    let sdk;
    let multiSideRecognizer;
    let recognizerRunner;

    try {
      sdk = await initializeBlinkID();
      multiSideRecognizer = await BlinkIDSDK.createBlinkIdMultiSideRecognizer(
        sdk
      );

      // Configuration du recognizer
      recognizerRunner = await BlinkIDSDK.createRecognizerRunner(
        sdk,
        [multiSideRecognizer],
        false
      );

      // Traitement du recto
      let frontResult = BlinkIDSDK.RecognizerResultState.Empty;
      const frontFrame = await fileToImageFrame(frontImage);
      frontResult = await recognizerRunner.processImage(frontFrame);

      if (frontResult === BlinkIDSDK.RecognizerResultState.Empty) {
        throw new Error(
          "Impossible de lire le recto du document. Veuillez vous assurer que l'image est claire et bien alignée."
        );
      }

      // Traitement du verso
      let backResult = BlinkIDSDK.RecognizerResultState.Empty;
      const backFrame = await fileToImageFrame(backImage);
      backResult = await recognizerRunner.processImage(backFrame);

      if (backResult === BlinkIDSDK.RecognizerResultState.Empty) {
        throw new Error(
          "Impossible de lire le verso du document. Veuillez vous assurer que l'image est claire et bien alignée."
        );
      }

      // Récupération des résultats
      const results = await multiSideRecognizer.getResult();
      if (!results || !results.firstName || !results.lastName) {
        throw new Error(
          'Document reconnu mais des informations essentielles sont manquantes. Veuillez réessayer avec des images de meilleure qualité.'
        );
      }

      return results;
    } catch (err) {
      console.error('Erreur de traitement:', err);
      throw err;
    } finally {
      recognizerRunner?.delete();
      multiSideRecognizer?.delete();
      // Note: deleteWasmModule n'est pas disponible dans cette version
    }
  };

  const handleCompare = async () => {
    if (!rectoFile || !versoFile) {
      toast.error("Veuillez fournir les deux côtés de la pièce d'identité");
      return;
    }

    setIsLoading(true);
    setError(null);
    setProcessingResult(null);
    toast.info('Traitement en cours...', { autoClose: false });

    try {
      console.log('Début de la vérification avec les fichiers:', {
        recto: rectoFile.name,
        verso: versoFile.name,
      });

      const result = await processID(rectoFile, versoFile);
      setProcessingResult(result);
      setResult('Vérification réussie !');
      toast.success('Vérification réussie !');
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Échec de la vérification du document';
      setError(errorMessage);
      console.error('Erreur de vérification:', err);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      toast.dismiss();
    }
  };

  return (
    <div className='min-h-screen bg-gray-50'>
      <Head>
        <title>Vérification d'identité</title>
        <meta
          name='description'
          content="Vérification de pièce d'identité"
        />
      </Head>

      <ToastContainer
        position='top-center'
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme='light'
      />

      <main className='container mx-auto py-8 px-4'>
        <h1 className='text-3xl font-bold text-center mb-8'>
          Vérification d'identité
        </h1>

        <div className='max-w-4xl mx-auto space-y-8'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {/* Recto */}
            <div className='space-y-4'>
              <h2 className='text-xl font-semibold'>
                Recto de la pièce d'identité
              </h2>
              {!isRectoCameraOn && (
                <DragDrop
                  onFileAccepted={handleRectoCapture}
                  label='Déposez le recto ici ou cliquez pour parcourir'
                  currentPreview={rectoPreview}
                  acceptedFormats='image/*'
                />
              )}
              <CameraCapture
                onCapture={handleRectoCapture}
                currentPreview={rectoPreview}
                onCameraStatusChange={setIsRectoCameraOn}
                title='Prendre une photo du recto'
              />
            </div>

            {/* Verso */}
            <div className='space-y-4'>
              <h2 className='text-xl font-semibold'>
                Verso de la pièce d'identité
              </h2>
              {!isVersoCameraOn && (
                <DragDrop
                  onFileAccepted={handleVersoCapture}
                  label='Déposez le verso ici ou cliquez pour parcourir'
                  currentPreview={versoPreview}
                  acceptedFormats='image/*'
                />
              )}
              <CameraCapture
                onCapture={handleVersoCapture}
                currentPreview={versoPreview}
                onCameraStatusChange={setIsVersoCameraOn}
                title='Prendre une photo du verso'
              />
            </div>
          </div>

          <button
            onClick={handleCompare}
            disabled={!rectoFile || !versoFile || isLoading}
            className={`px-6 py-3 rounded-lg w-full font-medium text-white ${
              !rectoFile || !versoFile || isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } transition-colors`}
          >
            {isLoading ? 'Traitement en cours...' : 'Vérifier mon identité'}
          </button>

          {isMounted && processingResult && (
            <IdVerificationResult processingResult={processingResult} />
          )}

          {isMounted && error && (
            <div className='p-4 bg-red-100 text-red-700 rounded-lg'>
              ❌ Erreur : {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
