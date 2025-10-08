import { toPng } from 'html-to-image';
import { useRef, useState } from 'react';

export default function SignaturePage() {
  const ref = useRef<HTMLDivElement>(null);
  const [imageUrl, setImageUrl] = useState('');

  const handleExport = async () => {
    if (ref.current === null) return;
    const dataUrl = await toPng(ref.current, {
      cacheBust: true,
      backgroundColor: 'transparent',
      pixelRatio: 2, // For retina-quality
    });
    setImageUrl(dataUrl);
  };

  return (
    <div className="min-h-screen bg-[#0a1733] text-white flex flex-col items-center justify-center space-y-6 px-4 py-12">
      <h1 className="text-xl font-semibold">Email Signature Preview</h1>

      <div ref={ref}>
        {/* Your actual card */}
        <div className="scale-100">
          <CardCanvas />
        </div>
      </div>

      <button
        onClick={handleExport}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
      >
        Export Transparent PNG
      </button>

      {imageUrl && (
        <div className="flex flex-col items-center space-y-4">
          <img
            src={imageUrl}
            alt="Signature Preview"
            className="rounded-xl border border-blue-500 shadow-lg w-[350px]"
          />
          <a
            href={imageUrl}
            download="anthonydaccurso-signature.png"
            className="text-blue-300 hover:underline"
          >
            Download Image
          </a>
          <textarea
            readOnly
            className="w-full max-w-[500px] p-2 text-sm bg-gray-800 text-white border border-gray-600 rounded-md"
            rows={4}
            value={`<a href="https://www.linkedin.com/in/anthony-daccurso/" target="_blank">
  <img src="${imageUrl}" alt="Anthony Daccurso Signature" width="350" style="border-radius:12px;" />
</a>`}
          />
        </div>
      )}
    </div>
  );
}