import React from "react";

interface PreviewPDFProps {
  isOpen: boolean;
  fileUrl: string | null;
  onClose: () => void;
}

const PreviewPDF: React.FC<PreviewPDFProps> = ({ isOpen, fileUrl, onClose }) => {
    if (!isOpen || !fileUrl) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-4/5 h-4/5 relative">
              <div className="absolute top-2 right-2">
                <button
                  onClick={onClose}
                  className="text-red-600 hover:text-red-800 font-bold text-xl"
                >
                  x
                </button>
              </div>
              <object
                data={fileUrl}
                type="application/pdf"
                width="100%"
                height="100%"
              >
                <p>
                  Your browser does not support PDFs. Please{" "}
                  <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                    download the PDF
                  </a>{" "}
                  to view it.
                </p>
              </object>
            </div>
        </div>
    );
};

export default PreviewPDF;
