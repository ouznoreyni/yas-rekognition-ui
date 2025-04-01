import * as BlinkIDSDK from "@microblink/blinkid-in-browser-sdk";

export interface ProcessingResult {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dateOfBirth?: string;
}

export const initializeBlinkID = async () => {
  if (!BlinkIDSDK.isBrowserSupported()) {
    throw new Error("Browser not supported");
  }

  const licenseKey = process.env.NEXT_PUBLIC_BLINKID_LICENSE_KEY;

  const loadSettings = new BlinkIDSDK.WasmSDKLoadSettings(licenseKey);

  loadSettings.engineLocation = "/resources";
  loadSettings.workerLocation = "/resources/BlinkIDWasmSDK.worker.min.js";

  return await BlinkIDSDK.loadWasmModule(loadSettings);
};

export const processImages = async (
  sdk: BlinkIDSDK.WasmSDK,
  frontImage: File,
  backImage: File
): Promise<ProcessingResult> => {
  const multiSideRecognizer = await BlinkIDSDK.createBlinkIdMultiSideRecognizer(
    sdk
  );
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
      return parseResults(results);
    }

    throw new Error("Could not process document");
  } finally {
    recognizerRunner?.delete();
    multiSideRecognizer?.delete();
  }
};

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

const parseResults = (
  results: BlinkIDSDK.BlinkIdMultiSideRecognizerResult
): ProcessingResult => {
  const firstName = results.firstName?.latin || results.mrz?.secondaryID;
  const lastName = results.lastName?.latin || results.mrz?.primaryID;
  const fullName = results.fullName?.latin || `${firstName} ${lastName}`;

  const dob = results.dateOfBirth || results.mrz?.dateOfBirth;
  const dateOfBirth = dob ? `${dob.year}-${dob.month}-${dob.day}` : undefined;

  return { firstName, lastName, fullName, dateOfBirth };
};
