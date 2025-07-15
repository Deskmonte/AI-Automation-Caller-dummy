import { useState } from 'react';

const steps = [
  'Upload Data',
  'Configure',
  'Process',
  'Results',
];

function App() {
  const [activeStep, setActiveStep] = useState(0);
  const [tab, setTab] = useState('file');
  const [sheetUrl, setSheetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState([]);

  const handleNext = async () => {
    setError('');
    if (tab === 'url') {
      if (!sheetUrl.trim()) {
        setError('Please enter a Google Sheets URL.');
        return;
      }
      setLoading(true);
      try {
        const res = await fetch('http://localhost:5000/api/upload-sheet-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: sheetUrl.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch phone numbers');
        setPhoneNumbers(data.phoneNumbers);
        setActiveStep(1);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setActiveStep(1); // File upload not implemented yet
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-green-400 mb-2 text-center">AI-Powered Lead Caller</h1>
      <p className="text-lg text-gray-300 mb-8 text-center max-w-xl">
        Upload your contacts, process them with AI-powered calling workflows, and get detailed results
      </p>
      {/* Stepper */}
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, idx) => (
          <div key={step} className="flex items-center">
            <div className={`rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold border-2 ${activeStep === idx ? 'bg-green-400 text-black border-green-400' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>{idx + 1}</div>
            {idx < steps.length - 1 && <div className="w-10 h-1 bg-gray-600 mx-2" />}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center mb-2 space-x-8">
        {steps.map((step, idx) => (
          <span key={step} className={`text-sm ${activeStep === idx ? 'text-green-400 font-semibold' : 'text-gray-400'}`}>{step}</span>
        ))}
      </div>
      {/* Step 1: Upload */}
      {activeStep === 0 && (
        <div className="bg-gray-900 rounded-lg shadow-lg p-8 w-full max-w-xl mt-8">
          <h2 className="text-2xl font-bold text-green-400 mb-2 flex items-center"><span className="mr-2">🗂️</span> Upload Your Contacts</h2>
          <p className="text-gray-400 mb-4">Choose how you'd like to import your contact data</p>
          <div className="flex mb-4">
            <button
              className={`flex-1 py-2 rounded-l-lg ${tab === 'file' ? 'bg-gray-800 text-green-400 font-bold' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setTab('file')}
            >
              <span className="mr-2">⬆️</span> Upload File
            </button>
            <button
              className={`flex-1 py-2 rounded-r-lg ${tab === 'url' ? 'bg-gray-800 text-green-400 font-bold' : 'bg-gray-700 text-gray-300'}`}
              onClick={() => setTab('url')}
            >
              <span className="mr-2">🔗</span> Google Sheets URL
            </button>
          </div>
          {tab === 'file' ? (
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center bg-black hover:border-green-400 transition-colors cursor-pointer">
              <span className="text-4xl mb-2">⤴️</span>
              <p className="mb-1">Drop your spreadsheet here or click to browse</p>
              <p className="text-sm text-gray-400">Supports Excel (.xlsx, .xls) and CSV files</p>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full">
              <input
                type="text"
                value={sheetUrl}
                onChange={e => setSheetUrl(e.target.value)}
                placeholder="Paste your public Google Sheets URL here"
                className="w-full p-3 rounded bg-gray-800 text-white border border-gray-600 focus:border-green-400 outline-none mb-2"
                disabled={loading}
              />
              <p className="text-sm text-gray-400">Make sure your sheet is public or shared with the app</p>
              {error && <p className="text-red-400 mt-2">{error}</p>}
            </div>
          )}
          <button
            className="mt-6 w-full bg-green-400 text-black font-bold py-3 rounded-lg hover:bg-green-300 transition-colors disabled:opacity-60"
            onClick={handleNext}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Next'}
          </button>
        </div>
      )}
      {/* Step 2: Show phone numbers if available */}
      {activeStep === 1 && tab === 'url' && (
        <div className="bg-gray-900 rounded-lg shadow-lg p-8 w-full max-w-xl mt-8 flex flex-col items-center">
          <h2 className="text-2xl font-bold text-green-400 mb-4">Extracted Phone Numbers</h2>
          {phoneNumbers.length > 0 ? (
            <ul className="mb-4 w-full max-h-60 overflow-y-auto text-left">
              {phoneNumbers.map((num, i) => (
                <li key={i} className="py-1 border-b border-gray-700">{num}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 mb-4">No phone numbers found.</p>
          )}
          <button className="w-full bg-gray-700 text-gray-300 font-bold py-3 rounded-lg hover:bg-gray-600 transition-colors" onClick={() => setActiveStep(0)}>Back</button>
        </div>
      )}
      {/* Placeholder for other steps */}
      {activeStep > 0 && !(activeStep === 1 && tab === 'url') && (
        <div className="bg-gray-900 rounded-lg shadow-lg p-8 w-full max-w-xl mt-8 flex flex-col items-center">
          <p className="text-gray-400">Step {activeStep + 1} coming soon...</p>
          <button className="mt-6 w-full bg-gray-700 text-gray-300 font-bold py-3 rounded-lg hover:bg-gray-600 transition-colors" onClick={() => setActiveStep(activeStep - 1)}>Back</button>
        </div>
      )}
    </div>
  );
}

export default App;
