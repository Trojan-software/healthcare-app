import React, { useState } from 'react';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  videoUrl?: string;
}

interface FAQSectionProps {
  onClose: () => void;
}

export default function FAQSection({ onClose }: FAQSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState('setup');
  const [searchTerm, setSearchTerm] = useState('');

  const faqData: FAQItem[] = [
    // Setup Category
    {
      id: 'setup-1',
      category: 'setup',
      question: 'How do I set up my HC03 device for the first time?',
      answer: 'To set up your HC03 device: 1) Charge the device completely, 2) Download the 24/7 Tele H app, 3) Turn on Bluetooth on your phone, 4) Press and hold the power button on HC03 for 3 seconds, 5) Follow the pairing instructions in the app.',
      videoUrl: 'https://example.com/setup-video'
    },
    {
      id: 'setup-2',
      category: 'setup',
      question: 'What should I do if my HC03 device won\'t connect to my phone?',
      answer: 'Try these steps: 1) Ensure Bluetooth is enabled, 2) Restart both devices, 3) Clear Bluetooth cache, 4) Make sure the device is in pairing mode, 5) Check if the device is already connected to another phone.',
    },
    {
      id: 'setup-3',
      category: 'setup',
      question: 'How do I register my device with my patient account?',
      answer: 'After successful pairing, open the app, go to Device Settings, and enter your patient ID. The device will automatically sync with your healthcare profile.',
    },

    // Blood Pressure Category
    {
      id: 'bp-1',
      category: 'blood-pressure',
      question: 'How do I take an accurate blood pressure reading?',
      answer: 'For accurate readings: 1) Sit quietly for 5 minutes before measuring, 2) Place the cuff on your upper arm at heart level, 3) Keep your feet flat on the floor, 4) Don\'t talk during measurement, 5) Take 2-3 readings with 1-minute intervals.',
      videoUrl: 'https://example.com/bp-video'
    },
    {
      id: 'bp-2',
      category: 'blood-pressure',
      question: 'What do the blood pressure numbers mean?',
      answer: 'Blood pressure readings show two numbers: Systolic (top number) measures pressure when your heart beats, Diastolic (bottom number) measures pressure between beats. Normal: <120/80, Elevated: 120-129/<80, High Stage 1: 130-139/80-89.',
    },
    {
      id: 'bp-3',
      category: 'blood-pressure',
      question: 'How often should I check my blood pressure?',
      answer: 'For routine monitoring: 2-3 times per week. If you have high blood pressure or other conditions, your doctor may recommend daily monitoring. Always follow your healthcare provider\'s specific instructions.',
    },

    // Heart Rate Category
    {
      id: 'hr-1',
      category: 'heart-rate',
      question: 'What is a normal heart rate range?',
      answer: 'Normal resting heart rate for adults: 60-100 beats per minute. Athletes may have rates as low as 40-60 bpm. Factors affecting heart rate include age, fitness level, medications, stress, and medical conditions.',
    },
    {
      id: 'hr-2',
      category: 'heart-rate',
      question: 'When should I be concerned about my heart rate?',
      answer: 'Contact your healthcare provider if: rate consistently above 100 or below 60 bpm (unless you\'re an athlete), irregular rhythms, chest pain, shortness of breath, dizziness, or fainting episodes.',
    },

    // Troubleshooting Category
    {
      id: 'trouble-1',
      category: 'troubleshooting',
      question: 'My device battery drains quickly. What should I do?',
      answer: 'To extend battery life: 1) Update device firmware, 2) Reduce measurement frequency if possible, 3) Turn off device when not in use, 4) Avoid extreme temperatures, 5) Replace battery if device is over 2 years old.',
    },
    {
      id: 'trouble-2',
      category: 'troubleshooting',
      question: 'The readings seem inaccurate. How can I fix this?',
      answer: 'For accurate readings: 1) Calibrate device monthly, 2) Clean sensors with alcohol wipe, 3) Ensure proper cuff placement, 4) Avoid movement during measurement, 5) Check for software updates.',
    },
    {
      id: 'trouble-3',
      category: 'troubleshooting',
      question: 'Data is not syncing to my healthcare provider. What should I do?',
      answer: 'Ensure: 1) Internet connection is stable, 2) App has latest updates, 3) Patient ID is correctly entered, 4) Device permissions are granted, 5) Contact support if issue persists.',
    },

    // General Usage
    {
      id: 'usage-1',
      category: 'usage',
      question: 'How do I clean and maintain my HC03 device?',
      answer: 'Clean weekly with: 1) Soft, damp cloth for exterior, 2) Alcohol wipes for sensors, 3) Avoid submerging in water, 4) Store in protective case, 5) Keep away from direct sunlight and extreme temperatures.',
    },
    {
      id: 'usage-2',
      category: 'usage',
      question: 'Can I share my device with family members?',
      answer: 'Each device should be assigned to one patient for accurate health tracking. If sharing is necessary, ensure proper user profile switching and notify your healthcare provider.',
    }
  ];

  const categories = [
    { id: 'setup', name: 'Device Setup', icon: '⚙️' },
    { id: 'blood-pressure', name: 'Blood Pressure', icon: '🩺' },
    { id: 'heart-rate', name: 'Heart Rate', icon: '❤️' },
    { id: 'usage', name: 'General Usage', icon: '📱' },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: '🔧' }
  ];

  const filteredFAQs = faqData.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold mb-2">Help & Support</h2>
              <p className="text-blue-100">Frequently Asked Questions & Device Instructions</p>
            </div>
            <button
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Categories Sidebar */}
          <div className="w-1/4 bg-gray-50 border-r border-gray-200 p-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-200 text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span>📚</span>
                  <span className="font-medium">All Categories</span>
                </div>
              </button>

              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span>{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Quick Contact */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Need More Help?</h4>
              <p className="text-blue-700 text-sm mb-3">Contact our support team</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <span>📞</span>
                  <span>+971-2-123-4567</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>✉️</span>
                  <span>support@24x7teleh.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>🕒</span>
                  <span>24/7 Available</span>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {filteredFAQs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No FAQs Found</h3>
                  <p className="text-gray-500">Try adjusting your search terms or category filter.</p>
                </div>
              ) : (
                filteredFAQs.map((faq) => (
                  <div key={faq.id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">{faq.question}</h3>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                        {categories.find(c => c.id === faq.category)?.name}
                      </span>
                    </div>
                    
                    <div className="text-gray-600 leading-relaxed mb-4">
                      {searchTerm && faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ? (
                        <span dangerouslySetInnerHTML={{
                          __html: faq.answer.replace(
                            new RegExp(searchTerm, 'gi'),
                            '<mark style="background-color: yellow;">$&</mark>'
                          )
                        }} />
                      ) : (
                        faq.answer
                      )}
                    </div>

                    {faq.videoUrl && (
                      <div className="flex items-center space-x-2">
                        <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-2">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                          <span>Watch Video Guide</span>
                        </button>
                        <span className="text-gray-500 text-sm">Visual step-by-step instructions</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div>Last updated: {new Date().toLocaleDateString()}</div>
            <div>24/7 Tele H Technology Services - Healthcare Support</div>
          </div>
        </div>
      </div>
    </div>
  );
}