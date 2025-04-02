import { ReactElement } from "react";

export interface ProcessingResult {
  firstName: string;
  lastName: string;
  issuingAuthority: string;
  address: string;
  classInfo: {
    countryName: string;
  };
  dateOfBirth: DateFields;
  dateOfExpiry: DateFields;
  dateOfIssue: DateFields;
  documentNumber: string;
  mrz: {
    documentNumber: string;
    gender: string;
    issuerName: string;
    nationalityName: string;
    sanitizedDocumentNumber: string;
  };
  personalIdNumber: string;
  placeOfBirth: string;
}

interface DateFields {
  day: number;
  month: number;
  year: number;
}

interface InfoItemProps {
  label: string;
  value?: string | number;
  multiline?: boolean;
}
const formatDate = (year?: number, month?: number, day?: number): string => {
  if (!year || !month || !day) return "Non disponible";
  return `${day.toString().padStart(2, "0")}/${month
    .toString()
    .padStart(2, "0")}/${year}`;
};
const InfoItem = ({
  label,
  value,
  multiline = false,
}: InfoItemProps): ReactElement => (
  <div className={`space-y-1 ${multiline ? "col-span-full" : ""}`}>
    <span className="text-sm font-medium text-gray-500">{label}</span>
    {value ? (
      <p className={`text-gray-900 ${multiline ? "whitespace-pre-line" : ""}`}>
        {value}
      </p>
    ) : (
      <p className="text-gray-400 italic">Non renseigné</p>
    )}
  </div>
);

export const IdVerificationResult = ({ processingResult }): ReactElement => {
  console.log("---------start-------------");

  console.log("Résultats de la vérification :");
  console.log(processingResult);
  console.log("-------end---------------");

  return (
    <div className="p-6 bg-white rounded-lg shadow-md space-y-4">
      <h2 className="text-2xl font-semibold text-green-600 mb-4 border-b pb-2">
        ✓ Vérification réussie
      </h2>

      {/* Personal Information Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-700">
          Informations Personnelles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoItem
            label="Prénom(s)"
            value={processingResult.firstName.latin}
            key={"firstName"}
          />
          <InfoItem
            label="Nom"
            value={processingResult.lastName.latin}
            key={"lastName"}
          />
          <InfoItem
            label="Date de Naissance"
            value={formatDate(
              processingResult.dateOfBirth.year,
              processingResult.dateOfBirth.month,
              processingResult.dateOfBirth.day
            )}
            key={"dateOfBirth"}
          />
          <InfoItem
            label="Lieu de Naissance"
            value={processingResult.placeOfBirth.latin}
            key={"placeOfBirth"}
          />
          <InfoItem
            label="Nationalité"
            value={processingResult.mrz.nationalityName}
            key={"nationalityName"}
          />
          <InfoItem
            label="Sexe"
            value={processingResult.sex.latin == "M" ? "Masculin" : "Féminin"}
            key={"gender"}
          />
        </div>
      </div>

      {/* Document Information Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-700">
          Document d&apos;Identité
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoItem
            label="Numéro de la carte d'identité"
            value={processingResult.documentNumber.latin}
            key={"documentNumber"}
          />
          <InfoItem
            label="NIN"
            value={processingResult.personalIdNumber.latin}
            key={"personalIdNumber"}
          />
          <InfoItem
            label="Centre d'enregistrement"
            value={processingResult.issuingAuthority.latin}
            key={"issuingAuthority"}
          />
          <InfoItem
            label="Pays Émetteur"
            value={processingResult.classInfo.countryName}
            key={"countryName"}
          />
          <InfoItem
            label="Adresse du domicile"
            value={processingResult.address.latin}
            key={"address"}
          />
        </div>
      </div>

      {/* Validity Section */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-700">Validité</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InfoItem
            label="Date de délivrance"
            value={formatDate(
              processingResult.dateOfIssue.year,
              processingResult.dateOfIssue.month,
              processingResult.dateOfIssue.day
            )}
            key={"dateOfIssue"}
          />
          <InfoItem
            label="Date d'expiration"
            value={formatDate(
              processingResult.dateOfExpiry.year,
              processingResult.dateOfExpiry.month,
              processingResult.dateOfExpiry.day
            )}
            key={"dateOfExpiry"}
          />
        </div>
      </div>
    </div>
  );
};
