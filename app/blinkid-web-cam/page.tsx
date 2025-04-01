"use client";

import * as BlinkIDSDK from "@microblink/blinkid-in-browser-sdk";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";

interface ProcessingResult {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dateOfBirth?: string;
}

export default function BlinkIDWebcamPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingResult, setProcessingResult] =
    useState<ProcessingResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanFeedback, setScanFeedback] = useState(
    "Point the camera at the front side of the document."
  );
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sdkRef = useRef<any>(null);
  const videoRecognizerRef = useRef<any>(null);

  // Initialize SDK
  useEffect(() => {
    const initializeBlinkID = async () => {
      if (!BlinkIDSDK.isBrowserSupported()) {
        setError("This browser is not supported!");
        return;
      }

      setIsLoading(true);
      const licenseKey =
        process.env.NEXT_PUBLIC_BLINKID_LICENSE_KEY || "your-license-key-here";
      const loadSettings = new BlinkIDSDK.WasmSDKLoadSettings(licenseKey);
      loadSettings.engineLocation = "/resources";
      loadSettings.workerLocation = "/resources/BlinkIDWasmSDK.worker.min.js";

      try {
        const sdk = await BlinkIDSDK.loadWasmModule(loadSettings);
        sdkRef.current = sdk;
      } catch (err) {
        setError("Failed to load SDK!");
        console.error("Failed to load SDK!", err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeBlinkID();
  }, []);

  // Start scanning when isScanning changes
  useEffect(() => {
    if (!isScanning) return;

    const startScan = async () => {
      if (!sdkRef.current || !videoRef.current || !canvasRef.current) {
        setError("Required elements are not available");
        setIsScanning(false);
        setIsLoading(false);
        return;
      }

      setError(null);
      setProcessingResult(null);
      setScanFeedback("Point the camera at the front side of the document.");

      const multiSideRecognizer =
        await BlinkIDSDK.createBlinkIdMultiSideRecognizer(sdkRef.current);
      const drawContext = canvasRef.current.getContext("2d");

      if (!drawContext) {
        setError("Failed to get canvas context");
        setIsScanning(false);
        setIsLoading(false);
        return;
      }

      const callbacks = {
        onQuadDetection: (quad: any) => drawQuad(quad, drawContext),
        onDetectionFailed: () => setScanFeedback("Detection failed"),
        onFirstSideResult: () =>
          setScanFeedback("Flip the document to scan the back side"),
      };

      const recognizerRunner = await BlinkIDSDK.createRecognizerRunner(
        sdkRef.current,
        [multiSideRecognizer],
        false,
        callbacks
      );

      try {
        const videoRecognizer =
          await BlinkIDSDK.VideoRecognizer.createVideoRecognizerFromCameraStream(
            videoRef.current,
            recognizerRunner
          );
        videoRecognizerRef.current = videoRecognizer;

        videoRecognizer.startRecognition(async (recognitionState) => {
          if (!videoRecognizer) return;

          videoRecognizer.pauseRecognition();

          if (recognitionState === BlinkIDSDK.RecognizerResultState.Empty)
            return;

          const result = await multiSideRecognizer.getResult();
          if (result.state === BlinkIDSDK.RecognizerResultState.Empty) return;

          const parsedResult = parseResults(result);
          setProcessingResult(parsedResult);
          setScanFeedback("Scan completed successfully!");

          videoRecognizer.releaseVideoFeed();
          recognizerRunner.delete();
          multiSideRecognizer.delete();
          setIsScanning(false);
          setIsLoading(false);
        });
      } catch (err) {
        setError("Error during scan initialization");
        console.error("Error during scan:", err);
        setIsScanning(false);
        setIsLoading(false);
      }
    };

    startScan();
  }, [isScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRecognizerRef.current) {
        videoRecognizerRef.current.releaseVideoFeed();
      }
      if (sdkRef.current) {
        sdkRef.current.delete();
      }
    };
  }, []);

  const parseResults = (result: any): ProcessingResult => {
    const firstName =
      result.firstName?.latin ||
      result.firstName?.cyrillic ||
      result.firstName?.arabic ||
      result.mrz?.secondaryID;
    const lastName =
      result.lastName?.latin ||
      result.lastName?.cyrillic ||
      result.lastName?.arabic ||
      result.mrz?.primaryID;
    const fullName =
      result.fullName?.latin ||
      result.fullName?.cyrillic ||
      result.fullName?.arabic ||
      `${result.mrz?.secondaryID} ${result.mrz?.primaryID}`;
    const dateOfBirth = result.dateOfBirth?.year
      ? `${result.dateOfBirth.year}-${result.dateOfBirth.month}-${result.dateOfBirth.day}`
      : result.mrz?.dateOfBirth?.year
      ? `${result.mrz.dateOfBirth.year}-${result.mrz.dateOfBirth.month}-${result.mrz.dateOfBirth.day}`
      : "";

    return { firstName, lastName, fullName, dateOfBirth };
  };

  const drawQuad = (quad: any, drawContext: CanvasRenderingContext2D) => {
    drawContext.clearRect(
      0,
      0,
      canvasRef.current!.width,
      canvasRef.current!.height
    );

    const color = quad.detectionStatus === 1 ? "#00FF00FF" : "#FF0000FF";
    drawContext.strokeStyle = color;
    drawContext.lineWidth = 5;

    drawContext.beginPath();
    drawContext.moveTo(quad.topLeft.x, quad.topLeft.y);
    drawContext.lineTo(quad.topRight.x, quad.topRight.y);
    drawContext.lineTo(quad.bottomRight.x, quad.bottomRight.y);
    drawContext.lineTo(quad.bottomLeft.x, quad.bottomLeft.y);
    drawContext.closePath();
    drawContext.stroke();

    updateScanFeedback(quad.detectionStatus);
  };

  const updateScanFeedback = (detectionStatus: number) => {
    switch (detectionStatus) {
      case BlinkIDSDK.DetectionStatus.Failed:
        setScanFeedback("Scanning...");
        break;
      case BlinkIDSDK.DetectionStatus.Success:
      case BlinkIDSDK.DetectionStatus.FallbackSuccess:
        setScanFeedback("Detection successful");
        break;
      case BlinkIDSDK.DetectionStatus.CameraAngleTooSteep:
        setScanFeedback("Adjust the angle");
        break;
      case BlinkIDSDK.DetectionStatus.CameraTooFar:
        setScanFeedback("Move document closer");
        break;
      case BlinkIDSDK.DetectionStatus.CameraTooClose:
      case BlinkIDSDK.DetectionStatus.DocumentTooCloseToCameraEdge:
      case BlinkIDSDK.DetectionStatus.DocumentPartiallyVisible:
        setScanFeedback("Move document farther");
        break;
      default:
        setScanFeedback("Scanning...");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Yes - Webcam ID Scan</title>
        <meta name="description" content="Scan your ID using your webcam" />
      </Head>

      <main className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          Scan Your ID with Webcam
        </h1>

        <div className="max-w-4xl mx-auto space-y-8">
          <button
            onClick={() => {
              setIsLoading(true);
              setIsScanning(true);
            }}
            disabled={isLoading || isScanning}
            className={`px-6 py-3 rounded-lg w-full font-medium text-white ${
              isLoading || isScanning
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } transition-colors`}
          >
            {isLoading || isScanning ? "Loading..." : "Start Scanning"}
          </button>

          {/* Always render video and canvas, but hide them when not scanning */}
          <div className={`relative ${!isScanning ? "hidden" : ""}`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 w-full h-full"
            />
            <p className="text-center mt-4 text-lg">{scanFeedback}</p>
          </div>

          {processingResult && (
            <div className="p-4 bg-green-100 text-green-700 rounded-lg">
              <p>✅ Scan successful!</p>
              <p>First Name: {processingResult.firstName}</p>
              <p>Last Name: {processingResult.lastName}</p>
              <p>Full Name: {processingResult.fullName}</p>
              <p>Date of Birth: {processingResult.dateOfBirth}</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-100 text-red-700 rounded-lg">
              ❌ Error: {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
