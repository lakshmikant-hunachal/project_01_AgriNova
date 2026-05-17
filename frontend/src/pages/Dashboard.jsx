import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, RefreshCw, Save, CheckCircle, AlertTriangle, Video, X } from 'lucide-react';
import { saveScan } from '../api/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('scanner');
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
    } else {
      setUser(JSON.parse(userData));
    }
    
    return () => stopCamera(); // Cleanup on unmount
  }, [navigate]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access the camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageDataUrl = canvas.toDataURL('image/jpeg');
      setSelectedImage(imageDataUrl);
      stopCamera();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setSelectedImage(e.target.result);
      reader.readAsDataURL(file);
      setScanResult(null);
    }
  };

  const handleScan = () => {
    if (!selectedImage) return;
    setIsScanning(true);
    
    // Simulate AI scanning delay
    setTimeout(() => {
      setIsScanning(false);
      setScanResult({
        disease: 'Early Blight',
        confidence: 94.5,
        treatment: 'Apply copper-based fungicide. Ensure proper spacing between plants for airflow.',
        timestamp: new Date().toISOString()
      });
    }, 2000);
  };

  const handleSaveScan = async () => {
    if (!scanResult || !user) return;
    try {
      await saveScan({
        userEmail: user.email,
        ...scanResult,
        image: selectedImage // In a real app, upload image to storage and save URL
      });
      alert('Scan saved to history successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save scan.');
    }
  };

  if (!user) return null;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-lg" style={{ marginBottom: '0.5rem' }}>Welcome, {user.name}</h1>
          <p style={{ color: 'var(--text-muted)' }}>Here is your farm overview and tools.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--surface-border)', marginBottom: '2rem', paddingBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab('scanner')} 
          style={{ background: 'none', color: activeTab === 'scanner' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'scanner' ? '600' : '500', padding: '0.5rem 1rem', borderBottom: activeTab === 'scanner' ? '2px solid var(--primary)' : 'none' }}
        >
          Disease Scanner
        </button>
        <button 
          onClick={() => setActiveTab('history')} 
          style={{ background: 'none', color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'history' ? '600' : '500', padding: '0.5rem 1rem', borderBottom: activeTab === 'history' ? '2px solid var(--primary)' : 'none' }}
        >
          Scan History
        </button>
      </div>

      {activeTab === 'scanner' && (
        <div className="grid">
          {/* Scanner Area */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 className="heading-md" style={{ alignSelf: 'flex-start', marginBottom: '1.5rem' }}>AI Crop Analyzer</h3>
            
            {!selectedImage && !isCameraOpen ? (
              <div style={{ width: '100%', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                <div 
                  style={{ width: '100%', border: '2px dashed var(--surface-border)', borderRadius: 'var(--radius-md)', padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)' }}
                  onClick={() => fileInputRef.current?.click()}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--surface-border)'}
                >
                  <div style={{ background: 'rgba(15, 23, 42, 0.5)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <Upload size={24} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <h4 style={{ fontWeight: '500', marginBottom: '0.5rem' }}>Upload from device</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Supports JPG, PNG (Max 5MB)</p>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
                  <hr style={{ flex: 1, borderColor: 'var(--surface-border)', opacity: 0.5 }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>OR</span>
                  <hr style={{ flex: 1, borderColor: 'var(--surface-border)', opacity: 0.5 }} />
                </div>

                <button onClick={startCamera} className="btn-outline" style={{ width: '100%', padding: '1rem' }}>
                  <Video size={20} /> Use Camera
                </button>
              </div>
            ) : isCameraOpen ? (
              <div style={{ width: '100%' }}>
                <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1.5rem', background: '#000' }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxHeight: '500px', display: 'block' }}></video>
                  <button onClick={stopCamera} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={20} />
                  </button>
                </div>
                <button onClick={captureImage} className="btn-primary" style={{ width: '100%' }}>
                  <Camera size={18} /> Capture Photo
                </button>
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
              </div>
            ) : (
              <div style={{ width: '100%' }}>
                <div style={{ position: 'relative', width: '100%', paddingTop: '75%', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1.5rem' }}>
                  <img src={selectedImage} alt="Crop" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                
                {!scanResult && (
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setSelectedImage(null)} className="btn-outline" style={{ flex: 1 }}>
                      <RefreshCw size={18} /> Retake
                    </button>
                    <button onClick={handleScan} className="btn-primary" style={{ flex: 2 }} disabled={isScanning}>
                      {isScanning ? (
                        <>Scanning...</>
                      ) : (
                        <><Camera size={18} /> Analyze Crop</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="glass-card">
            <h3 className="heading-md" style={{ marginBottom: '1.5rem' }}>Analysis Results</h3>
            
            {!scanResult ? (
              <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <Camera size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>Upload and analyze an image to see results here.</p>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <AlertTriangle size={24} style={{ color: 'var(--danger)' }} />
                  <div>
                    <h4 style={{ color: 'var(--danger)', fontWeight: '600' }}>Disease Detected</h4>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{scanResult.disease}</p>
                  </div>
                  <div style={{ marginLeft: 'auto', background: 'var(--danger)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {scanResult.confidence}% match
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={18} style={{ color: 'var(--primary)' }} />
                    Recommended Treatment
                  </h4>
                  <p style={{ color: 'var(--text-muted)', background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                    {scanResult.treatment}
                  </p>
                </div>

                <button onClick={handleSaveScan} className="btn-primary" style={{ width: '100%' }}>
                  <Save size={18} /> Save to My Records
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="glass-card">
          <h3 className="heading-md" style={{ marginBottom: '1.5rem' }}>Your Scan History</h3>
          <p style={{ color: 'var(--text-muted)' }}>History integration coming soon. This will display all your past scans fetched from the backend.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
