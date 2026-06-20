import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_COMPLAINTS = [
  {
    id: 'CMP-2024-001',
    title: 'Pothole causing road accidents near Connaught Place',
    description:
      'A large, deep pothole (approx. 2ft wide, 8 inches deep) has appeared on the main carriageway of Connaught Place outer circle near gate no. 5. Two motorcycles have already met with accidents. Urgent repair required before monsoon worsens the situation.',
    category: 'Roads',
    priority: 'High',
    status: 'In Review',
    timestamp: new Date('2024-06-15T09:23:00').toISOString(),
    lat: 28.6315,
    lng: 77.2167,
    language: 'English',
    submittedBy: 'Rajesh Kumar Sharma',
    ward: 'Connaught Place, Ward 42',
    upvotes: 87,
    aiSummary: 'Critical road safety issue requiring immediate intervention. High traffic zone.',
  },
  {
    id: 'CMP-2024-002',
    title: 'सार्वजनिक नल से पानी का रिसाव — 3 दिनों से जारी',
    description:
      'लाजपत नगर बाजार के पास मुख्य सड़क पर सार्वजनिक नल से पानी लगातार बह रहा है। इससे न केवल पानी की बर्बादी हो रही है, बल्कि सड़क पर कीचड़ और फिसलन भी बन रही है। स्थानीय दुकानदार परेशान हैं। कृपया तुरंत मरम्मत करें।',
    category: 'Water',
    priority: 'Med',
    status: 'Submitted',
    timestamp: new Date('2024-06-17T14:05:00').toISOString(),
    lat: 28.5693,
    lng: 77.2362,
    language: 'Hindi',
    submittedBy: 'Priya Mehta',
    ward: 'Lajpat Nagar, Ward 61',
    upvotes: 44,
    aiSummary: 'Continuous water leakage causing road damage and wastage. Mid-priority civic issue.',
  },
  {
    id: 'CMP-2024-003',
    title: 'Garbage not collected for 5 consecutive days in Sector 22',
    description:
      'Municipal garbage collection truck has not visited Sector 22, Rohini in 5 days. Heaps of waste are piling up outside residential blocks A, B, and C. Strong stench, mosquito breeding, and rodent sightings have been reported by multiple residents. This is a serious health and sanitation hazard.',
    category: 'Sanitation',
    priority: 'High',
    status: 'Submitted',
    timestamp: new Date('2024-06-18T07:45:00').toISOString(),
    lat: 28.7237,
    lng: 77.0851,
    language: 'English',
    submittedBy: 'Anita Verma',
    ward: 'Rohini Sector 22, Ward 7',
    upvotes: 132,
    aiSummary: 'Sanitation crisis with public health implications. Requires immediate dispatch of cleaning crew.',
  },
  {
    id: 'CMP-2024-004',
    title: 'Street lights non-functional on NH-48 flyover for 2 weeks',
    description:
      'All 18 street lights on the NH-48 Dhaula Kuan flyover have been non-functional for the past 2 weeks. The stretch is particularly dangerous after 9 PM with heavy truck traffic. A cyclist was injured last Tuesday due to low visibility. CPWD and MCD both claim jurisdiction belongs to the other agency.',
    category: 'Electricity',
    priority: 'High',
    status: 'In Review',
    timestamp: new Date('2024-06-12T21:30:00').toISOString(),
    lat: 28.5955,
    lng: 77.1695,
    language: 'English',
    submittedBy: 'Col. (Retd.) S.K. Nair',
    ward: 'Dhaula Kuan, Ward 38',
    upvotes: 209,
    aiSummary: 'Public safety risk on major highway. Inter-agency coordination needed immediately.',
  },
  {
    id: 'CMP-2024-005',
    title: 'Sewer overflow flooding residential lane in Karol Bagh',
    description:
      'The main sewer line on Arya Samaj Road, Karol Bagh has overflowed and is flooding the residential lane. Raw sewage is entering ground floors of houses No. 12–24. Children and elderly residents are most at risk. The NDMC helpline has been called 4 times with no response. Immediate pump-out and pipe repair essential.',
    category: 'Sanitation',
    priority: 'High',
    status: 'Resolved',
    timestamp: new Date('2024-06-10T11:00:00').toISOString(),
    lat: 28.6514,
    lng: 77.1908,
    language: 'English',
    submittedBy: 'Mohd. Aslam Khan',
    ward: 'Karol Bagh, Ward 55',
    upvotes: 311,
    aiSummary: 'Sewage overflow emergency resolved. Pipe repair completed. Follow-up inspection scheduled.',
  },
];

// ─── Context ──────────────────────────────────────────────────────────────────

const CivicContext = createContext(null);

export function CivicProvider({ children }) {
  const [complaints, setComplaints] = useState(SEED_COMPLAINTS);
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);

  const addComplaint = useCallback((complaint) => {
    const newComplaint = {
      ...complaint,
      id: `CMP-2024-${String(complaints.length + 6).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
      status: 'Submitted',
      upvotes: 0,
      aiSummary: 'Complaint submitted and queued for AI analysis.',
    };
    setComplaints((prev) => [newComplaint, ...prev]);
    addNotification({
      type: 'success',
      message: `Complaint ${newComplaint.id} filed successfully!`,
    });
    return newComplaint;
  }, [complaints.length]);

  const updateComplaintStatus = useCallback((id, status) => {
    setComplaints((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
  }, []);

  const addNotification = useCallback((notif) => {
    const id = Date.now();
    setNotifications((prev) => [{ ...notif, id }, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  const stats = {
    total: complaints.length,
    submitted: complaints.filter((c) => c.status === 'Submitted').length,
    inReview: complaints.filter((c) => c.status === 'In Review').length,
    resolved: complaints.filter((c) => c.status === 'Resolved').length,
    highPriority: complaints.filter((c) => c.priority === 'High').length,
    avgResolutionDays: 4.2,
    citizenSatisfaction: 87,
  };

  const categoryBreakdown = ['Roads', 'Sanitation', 'Water', 'Electricity'].map((cat) => ({
    name: cat,
    count: complaints.filter((c) => c.category === cat).length,
  }));

  return (
    <CivicContext.Provider
      value={{
        complaints,
        activeView,
        setActiveView,
        sidebarOpen,
        setSidebarOpen,
        notifications,
        addComplaint,
        updateComplaintStatus,
        addNotification,
        stats,
        categoryBreakdown,
      }}
    >
      {children}
    </CivicContext.Provider>
  );
}

export function useCivic() {
  const ctx = useContext(CivicContext);
  if (!ctx) throw new Error('useCivic must be used inside CivicProvider');
  return ctx;
}
