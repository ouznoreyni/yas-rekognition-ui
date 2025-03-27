import axios, { AxiosError } from "axios";

// Interface definitions
interface FaceMatch {
  similarity: number;
  confidence: number;
}

interface ResponseMetadata {
  request_id: string;
  http_status_code: number;
  retry_attempts: number;
}

export interface ComparisonResponse {
  source_confidence: number;
  source_image: string;
  target_image: string;
  similarity_threshold: number;
  similarity: number;
  face_matches: FaceMatch[];
  unmatched_faces: number;
  metadata: ResponseMetadata;
}

interface ApiErrorResponse {
  detail?: string;
  error?: string;
  message?: string;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const compareImages = async (
  sourceImage: File,
  targetImage: File,
  similarityThreshold = 70
): Promise<ComparisonResponse> => {
  const formData = new FormData();
  formData.append(
    "image_source",
    sourceImage,
    sourceImage.name || "source.jpg"
  );
  formData.append(
    "image_target",
    targetImage,
    targetImage.name || "target.jpg"
  );

  try {
    const response = await api.post<ComparisonResponse>(
      "/api/v1/compare-images/",
      formData,
      {
        params: { similarity_threshold: similarityThreshold },
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    let errorMessage = "Une erreur inconnue est survenue";

    if (axiosError.response?.data) {
      // Safely access error details with proper type checking
      errorMessage =
        axiosError.response.data.detail ||
        axiosError.response.data.error ||
        axiosError.response.data.message ||
        "Erreur du serveur";
    } else if (axiosError.request) {
      errorMessage = "Pas de réponse du serveur";
    } else {
      errorMessage = axiosError.message || "Erreur de configuration";
    }

    throw new Error(errorMessage);
  }
};
