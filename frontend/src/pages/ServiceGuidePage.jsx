import React, { useState, useEffect } from 'react';
import { officesAPI } from '../services/api';
import { ChevronDown, ChevronUp, FileText, IndianRupee, Clock, User, Phone, MapPin, CheckCircle, Mic, MicOff } from 'lucide-react';
import toast from 'react-hot-toast';

const OFFICE_ICONS = {
  'MeeSeva': '🏦', 'RTO Office': '🚗', 'Collectorate': '🏛️',
  'Municipal Corporation': '🏢', 'Registration Office': '📝', 'Tahsildar Office': '📜',
  'Passport Office': '✈️', 'SBI': '🏦', 'Union Bank': '🏦', 'Canara Bank': '🏦',
  'Indian Bank': '🏦', 'Andhra Bank': '🏦', 'HDFC Bank': '💳', 'ICICI Bank': '💳', 'Axis Bank': '💳',
};

const FAQItem = ({ faq }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '0.5rem' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.875rem', textAlign: 'left' }}>
        {faq.q}
        {open ? <ChevronUp size={16} color="var(--accent-teal)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </button>
      {open && (
        <div style={{ padding: '0 1rem 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', background: 'var(--bg-primary)' }}>
          {faq.a}
        </div>
      )}
    </div>
  );
};

const ServiceDetail = ({ service, office }) => {
  const docs = Array.isArray(service.documents_required) ? service.documents_required : JSON.parse(service.documents_required || '[]');
  const steps = Array.isArray(service.steps) ? service.steps : JSON.parse(service.steps || '[]');
  const faqs = Array.isArray(service.faqs) ? service.faqs : JSON.parse(service.faqs || '[]');

  return (
    <div>
      {/* Info Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}><IndianRupee size={20} color="var(--accent-gold)" /></div>
          <div style={{ fontWeight: 700, color: 'var(--accent-gold)', fontSize: '1.25rem' }}>₹{service.fees}</div>
          <div className="stat-label">Service Fee</div>
          {service.fees_description && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{service.fees_description}</div>}
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}><Clock size={20} color="var(--accent-teal)" /></div>
          <div style={{ fontWeight: 700, color: 'var(--accent-teal)', fontSize: '0.95rem' }}>{service.processing_time}</div>
          <div className="stat-label">Processing Time</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>📞</div>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{office?.phone || 'N/A'}</div>
          <div className="stat-label">Office Contact</div>
        </div>
        <div className="stat-card">
          <div style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>🕐</div>
          <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-primary)' }}>10:00 AM – 5:00 PM</div>
          <div className="stat-label">Working Hours</div>
        </div>
      </div>

      {/* Eligibility */}
      {service.eligibility && (
        <div style={{ padding: '1rem', background: 'rgba(13,148,136,0.06)', border: '1px solid rgba(13,148,136,0.15)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
          <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.875rem', color: 'var(--accent-teal)' }}>✅ Eligibility</div>
          <p style={{ fontSize: '0.875rem', margin: 0 }}>{service.eligibility}</p>
        </div>
      )}

      {/* Documents Required */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ marginBottom: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={18} color="var(--accent-teal)" /> Required Documents
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {docs.map((doc, i) => (
            <span key={i} className="document-chip">
              <CheckCircle size={12} color="var(--accent-teal)" /> {doc}
            </span>
          ))}
        </div>
      </div>

      {/* Step-by-Step Process */}
      {steps.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>📋 Step-by-Step Process</h4>
          <div className="steps-container">
            {steps.map((step, i) => (
              <div key={i} className="step-item">
                <div className="step-number">{i + 1}</div>
                <div className="step-content">
                  <p style={{ margin: 0, fontSize: '0.875rem' }}>{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAQs */}
      {faqs.length > 0 && (
        <div>
          <h4 style={{ marginBottom: '1rem' }}>❓ Frequently Asked Questions</h4>
          {faqs.map((faq, i) => <FAQItem key={i} faq={faq} />)}
        </div>
      )}

      {/* Google Maps Link */}
      {office?.google_map_url && (
        <div style={{ marginTop: '1.5rem' }}>
          <a href={office.google_map_url} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
            <MapPin size={15} /> View on Google Maps
          </a>
        </div>
      )}
    </div>
  );
};

const ServiceGuidePage = () => {
  const [offices, setOffices] = useState([]);
  const [selectedOfficeId, setSelectedOfficeId] = useState('');
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loadingServices, setLoadingServices] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error('Voice search is not supported on this browser.'); return; }
    if (isListening) { setIsListening(false); return; }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-IN';
      recognition.onstart = () => { setIsListening(true); toast.success('🎙️ Voice search active... Speak now!'); };
      recognition.onresult = (e) => { setSearchTerm(e.results[0][0].transcript); setIsListening(false); };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch { setIsListening(false); }
  };

  useEffect(() => {
    officesAPI.getAll().then(res => setOffices(res.data.data));
  }, []);

  useEffect(() => {
    if (selectedOfficeId) {
      setLoadingServices(true);
      officesAPI.getServices(selectedOfficeId)
        .then(res => { setServices(res.data.data); setSelectedService(null); })
        .finally(() => setLoadingServices(false));
    }
  }, [selectedOfficeId]);

  const selectedOffice = offices.find(o => o.id === selectedOfficeId);
  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page">
      <div className="container">
        <div style={{ marginBottom: '2rem' }}>
          <div className="hero-badge">📋 Complete Service Information</div>
          <h1 style={{ marginTop: '0.5rem' }}>Service Guide</h1>
          <p>Find documents, fees, eligibility, and step-by-step process for any government service</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Sidebar */}
          <div>
            <div className="card" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Select Office</label>
              <select className="form-select" value={selectedOfficeId} onChange={e => setSelectedOfficeId(e.target.value)}>
                <option value="">-- Choose office --</option>
                <optgroup label="🏛️ Government">
                  {offices.filter(o => o.type === 'government').map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </optgroup>
                <optgroup label="🏦 Banks">
                  {offices.filter(o => o.type === 'bank').map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </optgroup>
              </select>
            </div>

            {selectedOfficeId && (
              <div className="card">
                {selectedOffice && (
                  <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{OFFICE_ICONS[selectedOffice.name] || '🏢'} {selectedOffice.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                      <span className="flex items-center gap-1"><MapPin size={12} /> {selectedOffice.address?.substring(0, 55)}</span>
                      <span className="flex items-center gap-1"><Phone size={12} /> {selectedOffice.phone}</span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <input className="form-input" placeholder="🔍 Search services..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, fontSize: '0.875rem' }} />
                  <button className={`btn ${isListening ? 'btn-danger' : 'btn-outline'}`} onClick={handleVoiceSearch} title="Voice Search" type="button" style={{ padding: '0.5rem 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                </div>

                {loadingServices ? (
                  <div className="flex items-center justify-center" style={{ height: 80 }}><div className="loading-spinner" style={{ width: 28, height: 28, borderWidth: 2 }} /></div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {filteredServices.map(svc => (
                      <button
                        key={svc.id}
                        onClick={() => setSelectedService(svc)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '0.75rem', background: selectedService?.id === svc.id ? 'rgba(13,148,136,0.12)' : 'var(--bg-primary)',
                          border: `1px solid ${selectedService?.id === svc.id ? 'var(--accent-teal)' : 'var(--border-color)'}`,
                          borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'left', transition: 'var(--transition)'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{svc.name}</div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                            <span className="badge badge-teal" style={{ fontSize: '0.7rem' }}>{svc.category}</span>
                            <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>₹{svc.fees}</span>
                          </div>
                        </div>
                        <ChevronDown size={14} color="var(--text-muted)" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Service Detail */}
          <div>
            {selectedService ? (
              <div className="card">
                <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <span className="badge badge-teal" style={{ marginBottom: '0.5rem' }}>{selectedService.category}</span>
                      <h2 style={{ marginTop: '0.5rem', fontSize: '1.5rem' }}>{selectedService.name}</h2>
                      {selectedService.description && <p style={{ marginTop: '0.5rem' }}>{selectedService.description}</p>}
                    </div>
                  </div>
                </div>
                <ServiceDetail service={selectedService} office={selectedOffice} />
              </div>
            ) : selectedOfficeId ? (
              <div className="card text-center" style={{ padding: '4rem 2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
                <h3>Select a Service</h3>
                <p>Choose any service from the left panel to view complete details including required documents, fees, and step-by-step process.</p>
              </div>
            ) : (
              <div className="card text-center" style={{ padding: '4rem 2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏛️</div>
                <h3>Select an Office to Begin</h3>
                <p>Choose a government office or bank to explore the available services and their requirements.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceGuidePage;
