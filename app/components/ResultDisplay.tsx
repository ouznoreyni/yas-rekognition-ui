import { ComparisonResponse } from "../service/api";

interface ResultDisplayProps {
  result: ComparisonResponse | null;
  isLoading: boolean;
  error: string | null;
}

export default function ResultDisplay({
  result,
  isLoading,
  error,
}: ResultDisplayProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <p>{error}</p>
      </div>
    );
  }

  if (!result) return null;

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Comparison Results</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border rounded">
            <p className="font-medium">Source Image:</p>
            <p>{result.source_image}</p>
            <p>Confidence: {result.source_confidence.toFixed(2)}%</p>
          </div>
          <div className="p-4 border rounded">
            <p className="font-medium">Target Image:</p>
            <p>{result.target_image}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium">Face Matches</h4>
        {result.face_matches.length > 0 ? (
          <div className="space-y-4">
            {result.face_matches.map((match, index) => (
              <div key={index} className="p-4 bg-blue-50 rounded">
                <p>Similarity: {match.similarity.toFixed(2)}%</p>
                <p>Confidence: {match.confidence.toFixed(2)}%</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No face matches found</p>
        )}
      </div>

      <div className="p-4 bg-gray-50 rounded">
        <p>Unmatched faces: {result.unmatched_faces}</p>
        <p className="text-sm text-gray-500">
          Request ID: {result.metadata.request_id}
        </p>
      </div>
    </div>
  );
}
