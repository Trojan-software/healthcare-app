import React from 'react';
import { useLanguage } from '@/lib/i18n';
import { Shield, Lock, Eye, FileText, Users, Database } from 'lucide-react';

export default function PrivacyPolicyFooter() {
  const { isRTL } = useLanguage();

  const privacyPolicyContent = {
    en: {
      title: "Privacy & Confidentiality Policy",
      subtitle: "Your health information is protected with the highest security standards",
      sections: [
        {
          icon: Shield,
          title: "Data Protection",
          content: "All patient data is encrypted using AES-256 encryption and stored in secure, HIPAA-compliant databases. We implement multi-layer security protocols to ensure your medical information remains confidential."
        },
        {
          icon: Lock,
          title: "Access Control",
          content: "Only authorized healthcare professionals with proper credentials can access your medical records. All access attempts are logged and monitored for security compliance."
        },
        {
          icon: Eye,
          title: "Privacy Rights",
          content: "You have the right to access, modify, or delete your personal health information at any time. We never share your data with third parties without your explicit consent."
        },
        {
          icon: FileText,
          title: "Data Retention",
          content: "Medical records are retained according to UAE healthcare regulations and international standards. Data is automatically purged after the legally required retention period."
        },
        {
          icon: Users,
          title: "Healthcare Team Access",
          content: "Your healthcare team members have role-based access to relevant medical information necessary for providing quality care. All team members are bound by professional confidentiality agreements."
        },
        {
          icon: Database,
          title: "Secure Infrastructure",
          content: "Our systems use enterprise-grade security infrastructure with 24/7 monitoring, regular security audits, and compliance with international healthcare data protection standards."
        }
      ],
      footer: "For questions about privacy policies, contact: privacy@24x7teleh.com | Last updated: January 2025"
    },
    ar: {
      title: "سياسة الخصوصية والسرية",
      subtitle: "معلوماتك الصحية محمية بأعلى معايير الأمان",
      sections: [
        {
          icon: Shield,
          title: "حماية البيانات",
          content: "جميع بيانات المرضى مشفرة باستخدام تشفير AES-256 ومخزنة في قواعد بيانات آمنة متوافقة مع معايير HIPAA. نطبق بروتوكولات أمان متعددة الطبقات لضمان سرية معلوماتك الطبية."
        },
        {
          icon: Lock,
          title: "التحكم في الوصول",
          content: "فقط المهنيين الصحيين المصرح لهم بالاعتماد المناسب يمكنهم الوصول إلى سجلاتك الطبية. جميع محاولات الوصول مسجلة ومراقبة للامتثال الأمني."
        },
        {
          icon: Eye,
          title: "حقوق الخصوصية",
          content: "لديك الحق في الوصول إلى معلوماتك الصحية الشخصية أو تعديلها أو حذفها في أي وقت. لا نشارك بياناتك مع أطراف ثالثة دون موافقتك الصريحة."
        },
        {
          icon: FileText,
          title: "الاحتفاظ بالبيانات",
          content: "يتم الاحتفاظ بالسجلات الطبية وفقاً لأنظمة الرعاية الصحية في دولة الإمارات والمعايير الدولية. يتم حذف البيانات تلقائياً بعد فترة الاحتفاظ المطلوبة قانونياً."
        },
        {
          icon: Users,
          title: "وصول فريق الرعاية الصحية",
          content: "أعضاء فريق الرعاية الصحية لديهم وصول محدد بالأدوار للمعلومات الطبية ذات الصلة اللازمة لتقديم رعاية عالية الجودة. جميع أعضاء الفريق ملتزمون باتفاقيات السرية المهنية."
        },
        {
          icon: Database,
          title: "البنية التحتية الآمنة",
          content: "تستخدم أنظمتنا بنية تحتية أمنية من الدرجة المؤسسية مع مراقبة على مدار الساعة وعمليات تدقيق أمني منتظمة والامتثال للمعايير الدولية لحماية بيانات الرعاية الصحية."
        }
      ],
      footer: "للاستفسارات حول سياسات الخصوصية، اتصل بـ: privacy@24x7teleh.com | آخر تحديث: يناير 2025"
    }
  };

  const content = isRTL ? privacyPolicyContent.ar : privacyPolicyContent.en;

  return (
    <footer className={`bg-gray-50 border-t border-gray-200 mt-8 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className={`text-center mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{content.title}</h2>
          <p className="text-gray-600">{content.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          {content.sections.map((section, index) => (
            <div 
              key={index}
              className={`bg-white rounded-lg p-6 shadow-sm border border-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}
            >
              <div className={`flex items-center mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <section.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className={`text-lg font-semibold text-gray-900 ${isRTL ? 'mr-3' : 'ml-3'}`}>
                  {section.title}
                </h3>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        <div className={`border-t border-gray-200 pt-8 ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className="flex items-center justify-center">
            <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
              <Shield className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600 font-medium">
                {isRTL ? 'محمي بأعلى معايير الأمان' : 'Protected by highest security standards'}
              </span>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              {content.footer}
            </p>
          </div>
        </div>

        <div className={`mt-8 text-center ${isRTL ? 'text-right' : 'text-left'}`}>
          <div className="inline-flex items-center justify-center space-x-6 text-sm text-gray-500">
            <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>{isRTL ? 'متوافق مع معايير HIPAA' : 'HIPAA Compliant'}</span>
            </div>
            <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>{isRTL ? 'مشفر AES-256' : 'AES-256 Encrypted'}</span>
            </div>
            <div className={`flex items-center space-x-2 ${isRTL ? 'space-x-reverse' : ''}`}>
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>{isRTL ? 'ISO 27001 معتمد' : 'ISO 27001 Certified'}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}