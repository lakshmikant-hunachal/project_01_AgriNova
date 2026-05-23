import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, RefreshCw, Save, CheckCircle, AlertTriangle, Video, X, Sliders, TrendingUp } from 'lucide-react';
import { saveScan } from '../api/api';
import { useTranslation } from '../context/LanguageContext';

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('scanner');
  
  // Crop Scanner States
  const [selectedImage, setSelectedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  
  // Soil Advisor States
  const [selectedSoilImage, setSelectedSoilImage] = useState(null);
  const [isSoilScanning, setIsSoilScanning] = useState(false);
  const [soilResult, setSoilResult] = useState(null);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedWater, setSelectedWater] = useState('');
  const [advisoryResult, setAdvisoryResult] = useState(null);
  const [cropQuality, setCropQuality] = useState(null);
  const [animateCharts, setAnimateCharts] = useState(false);

  // Camera & Refs
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraType, setCameraType] = useState('crop'); // 'crop' or 'soil'
  
  const fileInputRef = useRef(null);
  const soilFileInputRef = useRef(null);
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

  useEffect(() => {
    if (isCameraOpen && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraOpen]);

  useEffect(() => {
    if (soilResult) {
      setAnimateCharts(false);
      const timer = setTimeout(() => setAnimateCharts(true), 100);
      return () => clearTimeout(timer);
    }
  }, [soilResult]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      setIsCameraOpen(true);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access the camera. Please check permissions.");
    }
  };

  const startCropCamera = () => {
    setCameraType('crop');
    startCamera();
  };

  const startSoilCamera = () => {
    setCameraType('soil');
    startCamera();
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
      
      if (cameraType === 'crop') {
        setSelectedImage(imageDataUrl);
      } else {
        setSelectedSoilImage(imageDataUrl);
      }
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

  const handleSoilUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setSelectedSoilImage(e.target.result);
      reader.readAsDataURL(file);
      setSoilResult(null);
      setAdvisoryResult(null);
      setCropQuality(null);
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

  const handleSoilScan = () => {
    if (!selectedSoilImage) return;
    setIsSoilScanning(true);
    
    // Simulate Soil scanning delay
    setTimeout(() => {
      setIsSoilScanning(false);
      const soils = [
        {
          type: 'Loamy Soil',
          ph: 6.5,
          crops: 'Tomato, Wheat, Maize, Potatoes',
          nutrients: { nitrogen: 45, phosphorus: 30, potassium: 25, carbon: 60 }
        },
        {
          type: 'Clayey Soil',
          ph: 7.2,
          crops: 'Rice, Wheat, Sugarcane, Soybeans',
          nutrients: { nitrogen: 35, phosphorus: 45, potassium: 20, carbon: 45 }
        },
        {
          type: 'Sandy Soil',
          ph: 5.8,
          crops: 'Groundnut, Potatoes, Carrots, Watermelon',
          nutrients: { nitrogen: 20, phosphorus: 25, potassium: 55, carbon: 30 }
        },
        {
          type: 'Black Soil',
          ph: 7.8,
          crops: 'Cotton, Wheat, Sugarcane, Groundnut',
          nutrients: { nitrogen: 40, phosphorus: 20, potassium: 40, carbon: 75 }
        },
        {
          type: 'Red Soil',
          ph: 6.2,
          crops: 'Maize, Groundnut, Ragi, Tobacco',
          nutrients: { nitrogen: 30, phosphorus: 30, potassium: 40, carbon: 50 }
        }
      ];
      // Select randomly
      const chosen = soils[Math.floor(Math.random() * soils.length)];
      setSoilResult(chosen);
    }, 2000);
  };

  const generateYieldStrategy = () => {
    if (!selectedCrop || !selectedSeason || !selectedWater) {
      alert("Please select all parameters first.");
      return;
    }

    // Set crop quality indices
    let health = 88;
    let moisture = 14;
    let grade = 'A';
    let diseaseRes = 85;

    // Adjust indices based on matches
    if (selectedWater === 'High') {
      moisture = 18;
      health += 4;
    } else if (selectedWater === 'Low') {
      moisture = 10;
      health -= 5;
      diseaseRes -= 5;
    }

    if (selectedSeason === 'Kharif') {
      health += 2;
    }

    // Cap values between 0 and 100
    health = Math.min(Math.max(health, 50), 98);
    moisture = Math.min(Math.max(moisture, 5), 95);
    diseaseRes = Math.min(Math.max(diseaseRes, 50), 98);
    grade = health > 92 ? 'A+' : health > 85 ? 'A' : health > 75 ? 'B+' : 'B';

    setCropQuality({
      health,
      moisture,
      grade,
      diseaseRes
    });

    // Content mapping for strategies
    const strategies = {
      Tomato: {
        strategy: "Prune lower leaves and suckers to enhance airflow and light penetration. Implement crop rotation with non-solanaceous crops to reduce soil-borne pests. Maintain consistent moisture levels using drip irrigation to prevent blossom-end rot.",
        fertilizer: "Apply N-P-K in a 1:2:2 ratio during early planting. Top-dress with Calcium Nitrate at fruit set to prevent calcium deficiency. Incorporate well-decomposed organic compost."
      },
      Rice: {
        strategy: "Use System of Rice Intensification (SRI) for water saving and root development. Maintain shallow flooding (2-5 cm) until grain filling. Ensure timely mechanical weeding to reduce nutrient competition.",
        fertilizer: "Apply Urea in three split doses (50% basal, 25% active tillering, 25% panicle initiation). Incorporate single superphosphate (SSP) and muriate of potash (MOP) as basal application."
      },
      Wheat: {
        strategy: "Sow at optimum depth of 4-5 cm. Apply light irrigation at critical stages (Crown Root Initiation, flowering, and jointing). Conduct line sowing instead of broadcasting for uniform yield.",
        fertilizer: "Apply full dose of Phosphorus (P) and Potassium (K) as basal. Top-dress Nitrogen (N) in two splits after first and second irrigation. Add Zinc Sulfate to correct local micronutrient deficiencies."
      },
      Cotton: {
        strategy: "Ensure optimal plant spacing of 60x30 cm. Practice timely nipping (pinching terminal buds at 75-80 days) to promote lateral sympodial branching. Maintain soil aeration via timely inter-cultivation.",
        fertilizer: "Incorporate organic farmyard manure (FYM) before sowing. Apply Nitrogen (N) in split doses matching vegetative and flowering peaks. Supplement with Boron sprays to reduce boll shedding."
      },
      Maize: {
        strategy: "Ensure deep summer ploughing to eradicate weeds and pests. Maintain optimal plant population of 66,000 plants/hectare. Avoid waterlogging during the early growth and flowering stages.",
        fertilizer: "Apply basal dose of NPK (120:60:40 kg/ha). Apply Nitrogen top-dressing at knee-high and tasseling stages. Apply zinc sulfate to prevent white bud disease."
      }
    };

    const cropData = strategies[selectedCrop] || {
      strategy: "Ensure soil pH is balanced. Practice drip irrigation to prevent root rot. Rotate crops annually.",
      fertilizer: "Apply balanced NPK fertilizer based on soil nutrient composition. Boost with organic compost."
    };

    setAdvisoryResult(cropData);
  };

  const handleSaveScan = async () => {
    if (!scanResult || !user) return;
    try {
      await saveScan({
        userEmail: user.email,
        ...scanResult,
        image: selectedImage
      });
      alert(t('dashboard.results.saveSuccess'));
    } catch (err) {
      console.error(err);
      alert(t('dashboard.results.saveFail'));
    }
  };

  if (!user) return null;

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="heading-lg" style={{ marginBottom: '0.5rem' }}>{t('dashboard.greeting')}{user.name}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{t('dashboard.subtitle')}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--surface-border)', marginBottom: '2rem', paddingBottom: '1rem', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('scanner')} 
          style={{ background: 'none', color: activeTab === 'scanner' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'scanner' ? '600' : '500', padding: '0.5rem 1rem', borderBottom: activeTab === 'scanner' ? '2px solid var(--primary)' : 'none' }}
        >
          {t('dashboard.tabScanner')}
        </button>
        <button 
          onClick={() => setActiveTab('soilAdvisor')} 
          style={{ background: 'none', color: activeTab === 'soilAdvisor' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'soilAdvisor' ? '600' : '500', padding: '0.5rem 1rem', borderBottom: activeTab === 'soilAdvisor' ? '2px solid var(--primary)' : 'none' }}
        >
          {t('dashboard.tabSoilAdvisor')}
        </button>
        <button 
          onClick={() => setActiveTab('history')} 
          style={{ background: 'none', color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: activeTab === 'history' ? '600' : '500', padding: '0.5rem 1rem', borderBottom: activeTab === 'history' ? '2px solid var(--primary)' : 'none' }}
        >
          {t('dashboard.tabHistory')}
        </button>
      </div>

      {activeTab === 'scanner' && (
        <div className="grid">
          {/* Scanner Area */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 className="heading-md" style={{ alignSelf: 'flex-start', marginBottom: '1.5rem' }}>{t('dashboard.scanner.title')}</h3>
            
            {!selectedImage && !(isCameraOpen && cameraType === 'crop') ? (
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
                  <h4 style={{ fontWeight: '500', marginBottom: '0.5rem' }}>{t('dashboard.scanner.uploadTitle')}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('dashboard.scanner.uploadDesc')}</p>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
                  <hr style={{ flex: 1, borderColor: 'var(--surface-border)', opacity: 0.5 }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>OR</span>
                  <hr style={{ flex: 1, borderColor: 'var(--surface-border)', opacity: 0.5 }} />
                </div>

                <button onClick={startCropCamera} className="btn-outline" style={{ width: '100%', padding: '1rem' }}>
                  <Video size={20} /> {t('dashboard.scanner.btnCamera')}
                </button>
              </div>
            ) : isCameraOpen && cameraType === 'crop' ? (
              <div style={{ width: '100%' }}>
                <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1.5rem', background: '#000' }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxHeight: '500px', display: 'block' }}></video>
                  <button onClick={stopCamera} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={20} />
                  </button>
                </div>
                <button onClick={captureImage} className="btn-primary" style={{ width: '100%' }}>
                  <Camera size={18} /> {t('dashboard.scanner.btnCapture')}
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
                      <RefreshCw size={18} /> {t('dashboard.scanner.btnRetake')}
                    </button>
                    <button onClick={handleScan} className="btn-primary" style={{ flex: 2 }} disabled={isScanning}>
                      {isScanning ? (
                        <>{t('dashboard.scanner.btnAnalyzing')}</>
                      ) : (
                        <><Camera size={18} /> {t('dashboard.scanner.btnAnalyze')}</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results Area */}
          <div className="glass-card">
            <h3 className="heading-md" style={{ marginBottom: '1.5rem' }}>{t('dashboard.results.title')}</h3>
            
            {!scanResult ? (
              <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <Camera size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>{t('dashboard.results.placeholder')}</p>
              </div>
            ) : (
              <div className="animate-fade-in">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <AlertTriangle size={24} style={{ color: 'var(--danger)' }} />
                  <div>
                    <h4 style={{ color: 'var(--danger)', fontWeight: '600' }}>{t('dashboard.results.detected')}</h4>
                    <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{scanResult.disease}</p>
                  </div>
                  <div style={{ marginLeft: 'auto', background: 'var(--danger)', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {scanResult.confidence}% {t('dashboard.results.match')}
                  </div>
                </div>

                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle size={18} style={{ color: 'var(--primary)' }} />
                    {t('dashboard.results.treatmentTitle')}
                  </h4>
                  <p style={{ color: 'var(--text-muted)', background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                    {scanResult.treatment}
                  </p>
                </div>

                <button onClick={handleSaveScan} className="btn-primary" style={{ width: '100%' }}>
                  <Save size={18} /> {t('dashboard.results.btnSave')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'soilAdvisor' && (
        <div className="grid">
          {/* Soil Analyzer Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h3 className="heading-md" style={{ alignSelf: 'flex-start', marginBottom: '1.5rem' }}>{t('dashboard.soil.title')}</h3>
            
            {!selectedSoilImage && !(isCameraOpen && cameraType === 'soil') ? (
              <div style={{ width: '100%', display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                <div 
                  style={{ width: '100%', border: '2px dashed var(--surface-border)', borderRadius: 'var(--radius-md)', padding: '3rem 2rem', textAlign: 'center', cursor: 'pointer', transition: 'var(--transition)' }}
                  onClick={() => soilFileInputRef.current?.click()}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--surface-border)'}
                >
                  <div style={{ background: 'rgba(15, 23, 42, 0.5)', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                    <Upload size={24} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <h4 style={{ fontWeight: '500', marginBottom: '0.5rem' }}>{t('dashboard.soil.uploadTitle')}</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('dashboard.scanner.uploadDesc')}</p>
                  <input type="file" ref={soilFileInputRef} onChange={handleSoilUpload} accept="image/*" style={{ display: 'none' }} />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0.5rem 0' }}>
                  <hr style={{ flex: 1, borderColor: 'var(--surface-border)', opacity: 0.5 }} />
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>OR</span>
                  <hr style={{ flex: 1, borderColor: 'var(--surface-border)', opacity: 0.5 }} />
                </div>

                <button onClick={startSoilCamera} className="btn-outline" style={{ width: '100%', padding: '1rem' }}>
                  <Video size={20} /> {t('dashboard.scanner.btnCamera')}
                </button>
              </div>
            ) : isCameraOpen && cameraType === 'soil' ? (
              <div style={{ width: '100%' }}>
                <div style={{ position: 'relative', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1.5rem', background: '#000' }}>
                  <video ref={videoRef} autoPlay playsInline style={{ width: '100%', maxHeight: '500px', display: 'block' }}></video>
                  <button onClick={stopCamera} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={20} />
                  </button>
                </div>
                <button onClick={captureImage} className="btn-primary" style={{ width: '100%' }}>
                  <Camera size={18} /> {t('dashboard.scanner.btnCapture')}
                </button>
                <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
              </div>
            ) : (
              <div style={{ width: '100%' }}>
                <div style={{ position: 'relative', width: '100%', paddingTop: '75%', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '1.5rem' }}>
                  <img src={selectedSoilImage} alt="Soil" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                
                {!soilResult && (
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => { setSelectedSoilImage(null); setSoilResult(null); }} className="btn-outline" style={{ flex: 1 }}>
                      <RefreshCw size={18} /> {t('dashboard.scanner.btnRetake')}
                    </button>
                    <button onClick={handleSoilScan} className="btn-primary" style={{ flex: 2 }} disabled={isSoilScanning}>
                      {isSoilScanning ? t('dashboard.soil.btnAnalyzing') : t('dashboard.soil.btnAnalyze')}
                    </button>
                  </div>
                )}

                {soilResult && (
                  <div className="animate-fade-in" style={{ width: '100%' }}>
                    <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{t('dashboard.soil.soilType')}:</span>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                          {t(`dashboard.soil.${soilResult.type.split(' ')[0].toLowerCase()}`)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{t('dashboard.soil.phLevel')}:</span>
                        <span style={{ fontWeight: 'bold' }}>{soilResult.ph}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('dashboard.soil.cropsLabel')}:</span>
                        <span style={{ fontWeight: '500', marginTop: '0.2rem' }}>{soilResult.crops}</span>
                      </div>
                    </div>

                    {/* Soil Nutrient composition Graph */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1.5rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sliders size={18} style={{ color: 'var(--primary)' }} />
                        {t('dashboard.soil.nutrientsTitle')}
                      </h4>
                      
                      {/* Nitrogen Bar */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                          <span>{t('dashboard.results.detected') ? 'Nitrogen (N)' : 'Nitrogen'}</span>
                          <span style={{ fontWeight: '600', color: '#34d399' }}>{soilResult.nutrients.nitrogen}% (Optimum)</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', height: '10px', overflow: 'hidden' }}>
                          <div style={{ background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)', width: animateCharts ? `${soilResult.nutrients.nitrogen}%` : '0%', height: '100%', borderRadius: 'var(--radius-full)', transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                        </div>
                      </div>

                      {/* Phosphorus Bar */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                          <span>Phosphorus (P)</span>
                          <span style={{ fontWeight: '600', color: '#60a5fa' }}>{soilResult.nutrients.phosphorus}% (Medium)</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', height: '10px', overflow: 'hidden' }}>
                          <div style={{ background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)', width: animateCharts ? `${soilResult.nutrients.phosphorus}%` : '0%', height: '100%', borderRadius: 'var(--radius-full)', transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                        </div>
                      </div>

                      {/* Potassium Bar */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                          <span>Potassium (K)</span>
                          <span style={{ fontWeight: '600', color: '#fbbf24' }}>{soilResult.nutrients.potassium}% (Optimum)</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', height: '10px', overflow: 'hidden' }}>
                          <div style={{ background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)', width: animateCharts ? `${soilResult.nutrients.potassium}%` : '0%', height: '100%', borderRadius: 'var(--radius-full)', transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                        </div>
                      </div>

                      {/* Organic Carbon Bar */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                          <span>Organic Carbon</span>
                          <span style={{ fontWeight: '600', color: '#c084fc' }}>{soilResult.nutrients.carbon}% (High)</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', height: '10px', overflow: 'hidden' }}>
                          <div style={{ background: 'linear-gradient(90deg, #a855f7 0%, #c084fc 100%)', width: animateCharts ? `${soilResult.nutrients.carbon}%` : '0%', height: '100%', borderRadius: 'var(--radius-full)', transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Advisory and Crop Quality Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 className="heading-md" style={{ marginBottom: '1.5rem' }}>Crop Advisory & Yield Planner</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="input-label">{t('dashboard.soil.selectCrop')}</label>
                <select 
                  className="input-field" 
                  value={selectedCrop} 
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--surface-border)', width: '100%', color: 'var(--text-main)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}
                >
                  <option value="">-- Choose Crop --</option>
                  <option value="Tomato">Tomato</option>
                  <option value="Rice">Rice</option>
                  <option value="Wheat">Wheat</option>
                  <option value="Cotton">Cotton</option>
                  <option value="Maize">Maize</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="input-label">{t('dashboard.soil.selectSeason')}</label>
                  <select 
                    className="input-field" 
                    value={selectedSeason} 
                    onChange={(e) => setSelectedSeason(e.target.value)}
                    style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--surface-border)', width: '100%', color: 'var(--text-main)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}
                  >
                    <option value="">-- Season --</option>
                    <option value="Kharif">Kharif (Monsoon)</option>
                    <option value="Rabi">Rabi (Winter)</option>
                    <option value="Zaid">Zaid (Summer)</option>
                  </select>
                </div>
                
                <div>
                  <label className="input-label">Water Level</label>
                  <select 
                    className="input-field" 
                    value={selectedWater} 
                    onChange={(e) => setSelectedWater(e.target.value)}
                    style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--surface-border)', width: '100%', color: 'var(--text-main)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}
                  >
                    <option value="">-- Water --</option>
                    <option value="High">Irrigated (High)</option>
                    <option value="Medium">Sprinklers/Drip (Medium)</option>
                    <option value="Low">Low / Rainfed</option>
                  </select>
                </div>
              </div>

              <button onClick={generateYieldStrategy} className="btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                {t('dashboard.soil.btnGenerate')}
              </button>
            </div>

            {advisoryResult && cropQuality && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', borderTop: '1px solid var(--surface-border)', paddingTop: '1.5rem' }}>
                
                <div>
                  <h4 style={{ fontWeight: '600', color: 'var(--primary)', marginBottom: '0.5rem' }}>{t('dashboard.soil.strategyTitle')}</h4>
                  <p style={{ color: 'var(--text-muted)', background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                    {advisoryResult.strategy}
                  </p>
                </div>

                <div>
                  <h4 style={{ fontWeight: '600', color: 'var(--secondary)', marginBottom: '0.5rem' }}>{t('dashboard.soil.fertilizerTitle')}</h4>
                  <p style={{ color: 'var(--text-muted)', background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                    {advisoryResult.fertilizer}
                  </p>
                </div>

                {/* Crop Quality Visualization */}
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1.5rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
                    {t('dashboard.soil.qualityTitle')}
                  </h4>
                  
                  <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    
                    {/* Glowing circular grade badge */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)', minWidth: '100px', flex: '1 1 auto' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Grade</span>
                      <div style={{ width: '54px', height: '54px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 'bold', color: '#fff', boxShadow: 'var(--shadow-glow)' }}>
                        {cropQuality.grade}
                      </div>
                    </div>

                    {/* Progress bars */}
                    <div style={{ flex: '2 1 200px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      
                      {/* Health Index */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                          <span>Health Index</span>
                          <span style={{ fontWeight: '600' }}>{cropQuality.health}%</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', height: '8px', overflow: 'hidden' }}>
                          <div style={{ background: '#10b981', width: `${cropQuality.health}%`, height: '100%', borderRadius: 'var(--radius-full)' }}></div>
                        </div>
                      </div>

                      {/* Moisture Content */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                          <span>Moisture Content</span>
                          <span style={{ fontWeight: '600' }}>{cropQuality.moisture}%</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', height: '8px', overflow: 'hidden' }}>
                          <div style={{ background: '#3b82f6', width: `${cropQuality.moisture}%`, height: '100%', borderRadius: 'var(--radius-full)' }}></div>
                        </div>
                      </div>

                      {/* Disease Resistance */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                          <span>Disease Resistance</span>
                          <span style={{ fontWeight: '600' }}>{cropQuality.diseaseRes}%</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-full)', height: '8px', overflow: 'hidden' }}>
                          <div style={{ background: '#f59e0b', width: `${cropQuality.diseaseRes}%`, height: '100%', borderRadius: 'var(--radius-full)' }}></div>
                        </div>
                      </div>

                    </div>

                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="glass-card">
          <h3 className="heading-md" style={{ marginBottom: '1.5rem' }}>{t('dashboard.history.title')}</h3>
          <p style={{ color: 'var(--text-muted)' }}>{t('dashboard.history.desc')}</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
