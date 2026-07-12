import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FaDownload, FaPrint, FaShare } from 'react-icons/fa';
import html2canvas from 'html2canvas';

const CertificateGenerator = ({ 
  childName = 'Makenna',
  date = new Date(),
  stars = 0,
  readingLevel = 'Emerging Reader',
  className = '' 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const certificateRef = useRef(null);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getReadingLevelText = (level) => {
    const levels = {
      'Emerging Reader': '🌱 Emerging Reader',
      'Beginning Reader': '📖 Beginning Reader',
      'Growing Reader': '🌟 Growing Reader',
      'Confident Reader': '📚 Confident Reader',
      'Advanced Reader': '🏆 Advanced Reader'
    };
    return levels[level] || level;
  };

  const generateImage = async () => {
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const link = document.createElement('a');
      link.download = `Alphabet_Certificate_${childName}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to generate certificate:', error);
    }
    setIsGenerating(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`${className}`}>
      {/* Certificate Preview */}
      <div className="bg-white rounded-2xl shadow-soft overflow-hidden p-8">
        <div
          ref={certificateRef}
          className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-12"
          style={{ minHeight: '600px' }}
        >
          {/* Decorative border */}
          <div className="absolute inset-4 border-4 border-primary/20 rounded-xl" />
          <div className="absolute inset-6 border-2 border-primary/10 rounded-xl" />

          {/* Content */}
          <div className="relative text-center">
            <div className="text-6xl mb-4">🎓</div>
            <h1 className="font-baloo text-4xl font-bold text-primary dark:text-blue-400">
              Alphabet Adventure Graduate!
            </h1>
            
            <div className="my-6">
              <p className="text-lg text-gray-600 dark:text-gray-300">
                This certificate is proudly presented to
              </p>
              <h2 className="font-baloo text-5xl font-bold text-gray-800 dark:text-white my-2">
                {childName}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                for successfully completing the Alphabet Adventure!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 my-8 max-w-md mx-auto">
              <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-3">
                <div className="text-2xl">⭐</div>
                <div className="text-sm font-bold text-gray-700 dark:text-gray-200">
                  {stars} Stars
                </div>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-3">
                <div className="text-2xl">📚</div>
                <div className="text-sm font-bold text-gray-700 dark:text-gray-200">
                  {getReadingLevelText(readingLevel)}
                </div>
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-3">
                <div className="text-2xl">📅</div>
                <div className="text-sm font-bold text-gray-700 dark:text-gray-200">
                  {formatDate(date)}
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-8 mt-8">
              <div>
                <div className="w-32 h-12 border-b-2 border-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Teacher's Signature
                </p>
              </div>
              <div>
                <div className="w-32 h-12 border-b-2 border-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Parent's Signature
                </p>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-400 dark:text-gray-500">
              Makenna Learning Lab • Watch • Play • Learn • Grow
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mt-4 justify-center">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={generateImage}
          disabled={isGenerating}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          <FaDownload />
          {isGenerating ? 'Generating...' : 'Download Certificate'}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <FaPrint />
          Print
        </motion.button>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .certificate-print,
          .certificate-print * {
            visibility: visible;
          }
          .certificate-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default CertificateGenerator;