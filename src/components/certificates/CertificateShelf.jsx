import { useEffect, useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { useChildAccount } from '../../context/ChildAccountContext';
import { CertificateService } from '../../services/CertificateService';
import CertificateGenerator from '../graduation/CertificateGenerator';

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Unknown date'
    : date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
};

const CertificateShelf = () => {
  const { childId } = useChildAccount();
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    const refresh = () => setCertificates(CertificateService.list(childId));
    refresh();
    return CertificateService.subscribe(refresh);
  }, [childId]);

  if (certificates.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 rounded-2xl bg-gray-50 dark:bg-gray-900/40 p-4">
        No certificates saved yet. Finish the Alphabet Adventure to earn one, then tap
        &ldquo;Save to my certificates&rdquo;.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {certificates.map((certificate) => (
        <div key={certificate.id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-baloo text-lg font-bold text-gray-800 dark:text-white">
                🏅 {certificate.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {certificate.childName} • {formatDate(certificate.date)} • {certificate.stars} stars
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Remove "${certificate.title}" from your certificates?`)) {
                  CertificateService.remove(childId, certificate.id);
                }
              }}
              className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
              aria-label={`Remove ${certificate.title}`}
            >
              <FaTrash />
            </button>
          </div>
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-semibold text-blue-600 dark:text-blue-400">
              View, print or download this certificate
            </summary>
            <div className="mt-4">
              <CertificateGenerator
                childName={certificate.childName}
                date={certificate.date}
                stars={certificate.stars}
                readingLevel={certificate.readingLevel}
                achievement={certificate.achievement}
              />
            </div>
          </details>
        </div>
      ))}
    </div>
  );
};

export default CertificateShelf;
